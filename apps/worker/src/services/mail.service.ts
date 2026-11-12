import nodemailer, { type SMTPTransportOptions } from "nodemailer";
import Handlebars from "handlebars";
import { readFileSync } from "node:fs";
import { processJob } from "../process-job.js";
import type { OrganizationInvitationEmailJob } from "../job-inputs.js";
import type { Job } from "bullmq";
import { prisma } from "@enterprise/db";

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function createMailTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;
  const secureValue = process.env.SMTP_SECURE ?? "false";
  const secure = secureValue === "true";
  const port = Number(process.env.SMTP_PORT ?? (secure ? "465" : "587"));

  if (!host) throw new Error("SMTP_HOST is required to send email");
  if (!["true", "false"].includes(secureValue)) {
    throw new Error("SMTP_SECURE must be true or false");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid port number");
  }
  if (Boolean(user) !== Boolean(pass)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together");
  }

  const options: SMTPTransportOptions = {
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: user && pass ? { user, pass } : undefined,
    tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
  };

  console.log(options);

  return nodemailer.createTransport(options);
}

let transporter: ReturnType<typeof createMailTransport> | undefined;

async function sendMail(input: MailInput) {
  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();
  if (!from) throw new Error("SMTP_FROM is required to send email");

  transporter ??= createMailTransport();
  return transporter.sendMail({ ...input, from });
}

const template = Handlebars.compile(
  readFileSync(
    new URL("../templates/organization-invitation.hbs", import.meta.url),
    "utf8",
  ),
  { strict: true },
);

type OrganizationInvitationEmail = {
  email: string;
  organizationName: string;
  inviterName: string;
  groupName: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  invitationUrl: string;
  expiresAt: Date;
};

function sendOrganizationInvitationEmail(input: OrganizationInvitationEmail) {
  const url = new URL(input.invitationUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Invitation URL must use HTTP or HTTPS");
  }

  const roleName = input.role === "ADMIN" ? "Admin" : "Member";
  const expiresAt =
    input.expiresAt.toLocaleString("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "UTC",
    }) + " UTC";
  const invitationUrl = url.href;

  return sendMail({
    to: input.email,
    subject: "You're invited to " + input.organizationName,
    html: template({ ...input, roleName, expiresAt, invitationUrl }),
    text: [
      input.inviterName +
        " has invited you to join " +
        input.organizationName +
        ".",
      "Group: " + input.groupName,
      "Role: " + roleName,
      "Review your invitation to accept or decline: " + invitationUrl,
      "This invitation expires on " + expiresAt + ".",
      "This invitation was sent to " +
        input.email +
        ". If you weren't expecting it, you can ignore this email.",
    ].join("\n\n"),
  });
}

export const processEmailJob = async (
  job: Job<OrganizationInvitationEmailJob>,
) => {
  if (job.name === "organization-invitation") {
    const { invitationId, invitationUrl } = job.data;

    const invitation = await prisma.organizationInvitation.findUnique({
      where: { id: invitationId },
      include: { organization: true, invitedByUser: true, group: true },
    });
    if (
      !invitation ||
      invitation.status !== "PENDING" ||
      invitation.expiresAt <= new Date() ||
      invitation.organization.status !== "ACTIVE" ||
      !invitation.group ||
      invitation.group.organizationId !== invitation.organizationId
    ) {
      return { status: "skipped" };
    }

    try {
      await sendOrganizationInvitationEmail({
        email: invitation.email,
        organizationName: invitation.organization.name,
        inviterName: invitation.invitedByUser.name,
        groupName: invitation.group.name,
        role: invitation.role,
        invitationUrl,
        expiresAt: invitation.expiresAt,
      });
    } catch (error) {
      await prisma.organizationInvitation.updateMany({
        where: { id: invitationId, status: "PENDING" },
        data: { status: "REVOKED" },
      });
      throw error;
    }
    return { status: "sent" };
  }
  return processJob(job);
};
