import { type Prisma, prisma } from "@enterprise/db";
import type {
  AcceptInviteInput,
  RejectInviteInput,
} from "../types/organization.type.js";
import { TRPCError } from "@trpc/server";
import { generateJWT, hashPassword } from "@enterprise/auth";
import { createHash, randomBytes } from "node:crypto";
import { invitationResponseError } from "../error-handlers/organization.errorHandler.js";
import { createUser } from "./user.repository.js";
import { normalizeEmail } from "../utils/helpers.js";

export const createOrganization = async (
  organizationName: string,
  db: Prisma.TransactionClient = prisma,
) => {
  // Find number of organizations with the same name
  const count = await db.organization.count({
    where: {
      name: organizationName,
    },
  });

  return await db.organization.create({
    data: {
      name: organizationName,
      slug: slugify(organizationName, count),
    },
  });
};

export const createOrganizationMember = (
  input: {
    organizationId: string;
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
  },
  db: Prisma.TransactionClient = prisma,
) => {
  const { organizationId, userId, role } = input;

  return db.organizationMember.create({
    data: {
      organizationId,
      userId,
      role,
    },
  });
};

export const inviteOrganizationMember = async (input: {
  email: string;
  organizationId: string;
  role: "MEMBER" | "ADMIN";
  invitedByUserId: string;
}) => {
  const { token, tokenHash } = generateInvitationToken();

  const invitation = await prisma.organizationInvitation.create({
    data: {
      ...input,
      email: normalizeEmail(input.email),
      tokenHash,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  return {
    id: invitation.id,
    email: invitation.email,
    expiresAt: invitation.expiresAt,
    token,
  };
};

export const acceptOrganizationInvite = async (
  input: AcceptInviteInput,
  signedInUserId?: string,
) => {
  try {
    const respondedAt = new Date();

    // Hash before opening the transaction to avoid holding locks during hashing.
    const passwordHash = input.password
      ? hashPassword(input.password)
      : undefined;
    return await prisma.$transaction(async (tx) => {
      const invitation = await findPendingInvitation(tx, input.token);

      let user = await findInvitedUser(tx, invitation.email, signedInUserId);

      if (user && !signedInUserId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Sign in to your existing account to accept this invitation",
        });
      }

      if (user && user.status !== "ACTIVE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your account is not active",
        });
      }

      if (!user && (!input.name || !passwordHash)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Name and password are required to create your account",
        });
      }

      if (!user) {
        // Guard again here so TypeScript narrows the registration fields.
        if (!input.name || !passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Name and password are required to create your account",
          });
        }
        user = await createUser(
          {
            email: normalizeEmail(invitation.email),
            name: input.name,
            passwordHash,
          },
          tx,
        );
      }

      await consumeInvitation(
        tx,
        invitation.id,
        "ACCEPTED",
        respondedAt,
        user.id,
      );

      let membership = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId: user.id,
          },
        },
      });

      if (!membership) {
        membership = await createOrganizationMember(
          {
            organizationId: invitation.organizationId,
            userId: user.id,
            role: invitation.role,
          },
          tx,
        );
      }

      const token = generateJWT({
        userId: user.id,
        organizationId: membership.organizationId,
        role: membership.role,
      });

      return {
        action: "accept" as const,
        token,
        user: { id: user.id, email: user.email, name: user.name },
        organizationId: membership.organizationId,
        role: membership.role,
      };
    });
  } catch (error) {
    throw invitationResponseError(error);
  }
};

export const rejectOrganizationInvite = async (input: RejectInviteInput) => {
  try {
    const respondedAt = new Date();

    return await prisma.$transaction(async (tx) => {
      const invitation = await findPendingInvitation(tx, input.token);
      await consumeInvitation(tx, invitation.id, "REJECTED", respondedAt);
      return { action: "reject" as const };
    });
  } catch (error) {
    throw invitationResponseError(error);
  }
};

const findPendingInvitation = async (
  tx: Prisma.TransactionClient,
  token: string,
  respondedAt = new Date(),
) => {
  const invitation = await tx.organizationInvitation.findFirst({
    where: {
      AND: {
        tokenHash: hashInvitationToken(token),
        status: "PENDING",
      },
    },
    include: { organization: { select: { status: true } } },
  });

  if (!invitation) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invitation is invalid, expired, or already used",
    });
  }

  if (invitation.expiresAt <= respondedAt) {
    // Update invitation status to EXPIRED
    await tx.organizationInvitation.updateMany({
      where: {
        AND: { id: invitation.id },
      },
      data: {
        status: "EXPIRED",
      },
    });
  }

  if (invitation.organization.status !== "ACTIVE") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization is not active",
    });
  }

  return invitation;
};

const findInvitedUser = async (
  tx: Prisma.TransactionClient,
  invitedEmail: string,
  signedInUserId?: string,
) => {
  const email = normalizeEmail(invitedEmail);
  const user = signedInUserId
    ? await tx.user.findUnique({ where: { id: signedInUserId } })
    : await tx.user.findUnique({ where: { email } });
  if (signedInUserId && (!user || normalizeEmail(user.email) !== email)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Invitation belongs to another email address",
    });
  }
  return user;
};

const consumeInvitation = async (
  tx: Prisma.TransactionClient,
  id: string,
  status: "ACCEPTED" | "REJECTED",
  respondedAt: Date,
  acceptedByUserId?: string,
) => {
  // Only one concurrent response can consume a pending invitation.
  const claimed = await tx.organizationInvitation.updateMany({
    where: {
      AND: { id, status: "PENDING", expiresAt: { gt: respondedAt } },
    },
    data: {
      status,
      respondedAt,
      acceptedByUserId,
    },
  });

  if (claimed.count !== 1) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Invitation is expired or already used",
    });
  }
};

const slugify = (name: string, count = 0) => {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .concat(count > 0 ? `_${count}` : "");
};

const hashInvitationToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const generateInvitationToken = () => {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
};
