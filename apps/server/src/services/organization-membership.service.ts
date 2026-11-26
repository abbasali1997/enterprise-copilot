import type { OrganizationRole } from "@enterprise/auth";
import {
  createOrganizationMember,
  findOrganizationMember,
  findOrganizationMembers,
} from "../repositories/organization-membership.repository.js";
import { prisma } from "@enterprise/db";
import { TRPCError } from "@trpc/server";
import { can, generateJWT, hashPassword, PERMISSIONS } from "@enterprise/auth";
import { createHash, randomBytes } from "node:crypto";
import type {
  AcceptInviteInput,
  InviteResponseInput,
  RejectInviteInput,
} from "../types/organization.type.js";
import { invitationResponseError } from "../error-handlers/organization.errorHandler.js";
import { normalizeEmail } from "../utils/helpers.js";
import {
  claimOrganizationInvitation,
  createOrganizationInvitation,
  findOrganizationInvitationByTokenHash,
  findPendingOrganizationInvitation,
  markInvitationExpired,
  setInvitationAcceptedByUser,
} from "../repositories/organization.repository.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../repositories/user.repository.js";
import { logger } from "../utils/logger.js";
import { errorDetails } from "../utils/log-operation.js";
import { emailQueue } from "@enterprise/worker/queues";

export const inviteOrganizationMember = async (
  input: {
    email: string;
    groupId: string;
    role: "MEMBER" | "ADMIN";
  },
  signedInUserId: string,
  activeOrganizationId: string,
  role: OrganizationRole,
) => {
  const inviter = await findUserById(signedInUserId);

  if (!inviter) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `User not found with id ${signedInUserId}`,
    });
  }

  const email = normalizeEmail(input.email);

  if (!can(role, PERMISSIONS.MEMBER_INVITE)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to invite members",
    });
  }

  const group = await prisma.organizationGroup.findFirst({
    where: { id: input.groupId, organizationId: activeOrganizationId },
  });

  if (!group) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Group not found in this workspace",
    });
  }

  /*
   * Don't invite somebody who is already a member.
   */
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const existingMembership = await findOrganizationMember({
      organizationId: activeOrganizationId,
      userId: existingUser.id,
    });

    if (existingMembership) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This user is already a member of the organization",
      });
    }
  }

  /*
   * Don't create multiple live invitations.
   */
  const existingInvitation = await findPendingOrganizationInvitation({
    organizationId: activeOrganizationId,
    email,
  });

  if (existingInvitation) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A pending invitation already exists for this email",
    });
  }

  const { token, tokenHash } = generateInvitationToken();

  const invitationUrl = getInvitationUrl(token);

  const invitation = await createOrganizationInvitation({
    email,
    organizationId: activeOrganizationId,
    role: input.role,
    groupId: input.groupId,
    invitedByUserId: signedInUserId,
    tokenHash,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  });

  try {
    await emailQueue.add(
      "organization-invitation",
      {
        invitationId: invitation.id,
        invitationUrl,
      },
      { jobId: invitation.id },
    );
  } catch (error) {
    await prisma.organizationInvitation.updateMany({
      where: { id: invitation.id, status: "PENDING" },
      data: { status: "REVOKED" },
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not queue the invitation email. Please try again.",
      cause: error,
    });
  }

  logger.success(
    `Invitation ${invitation.id} created for workspace ${activeOrganizationId} by user ${signedInUserId} with role ${input.role}`,
  );

  return {
    id: invitation.id,
    email: invitation.email,
    expiresAt: invitation.expiresAt,
    token,
  };
};

/* ============================================================
   Accept invitation
   ============================================================ */
export const acceptOrganizationInvite = async (
  input: AcceptInviteInput,
  signedInUserId?: string,
) => {
  try {
    const respondedAt = new Date();

    const tokenHash = hashInvitationToken(input.token);

    const passwordHash = input.password
      ? await hashPassword(input.password)
      : undefined;

    const result = await prisma.$transaction(async (tx) => {
      let invitation = await findOrganizationInvitationByTokenHash(
        tokenHash,
        tx,
      );

      invitation = validateInvitation(invitation, respondedAt);

      if (invitation.organization.status !== "ACTIVE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Organization is not active",
        });
      }

      const group = invitation.groupId
        ? await tx.organizationGroup.findFirst({
            where: {
              id: invitation.groupId,
              organizationId: invitation.organizationId,
            },
          })
        : null;
      if (!group) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "The invitation group is unavailable. Ask for a new invitation.",
        });
      }

      const invitedEmail = normalizeEmail(invitation.email);

      let user;

      if (signedInUserId) {
        user = await findUserById(signedInUserId, tx);

        if (!user || normalizeEmail(user.email) !== invitedEmail) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invitation belongs to another email address",
          });
        }
      }

      if (!signedInUserId) {
        user = await findUserByEmail(invitedEmail, tx);

        if (user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "Sign in to your existing account to accept this invitation",
          });
        }
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

      /*
       * Claim BEFORE creating the user.
       *
       * This ensures two concurrent requests cannot
       * both create accounts/memberships using the
       * same invitation.
       *
       * If later operations fail, the transaction
       * rolls this claim back.
       */

      const claimed = await claimOrganizationInvitation(
        {
          id: invitation.id,
          tokenHash: invitation.tokenHash,
          status: "ACCEPTED",
          respondedAt,
        },
        tx,
      );

      if (claimed.count !== 1) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Invitation is expired or already used",
        });
      }

      if (!user) {
        user = await createUser(
          {
            email: invitedEmail,
            name: input.name!.trim(),
            passwordHash: passwordHash!,
          },
          tx,
        );
      }

      await setInvitationAcceptedByUser(
        {
          invitationId: invitation.id,

          userId: user.id,
        },
        tx,
      );

      let membership = await findOrganizationMember(
        {
          organizationId: invitation.organizationId,
          userId: user.id,
        },
        tx,
      );

      if (!membership) {
        membership = await createOrganizationMember(
          {
            organizationId: invitation.organizationId,
            userId: user.id,
            role: invitation.role,
            groupId: group.id,
          },
          tx,
        );
      }

      return {
        user,
        membership,
      };
    });

    logger.success(
      `Invitation accepted by user ${result.user.id}; membership ${result.membership.id} in workspace ${result.membership.organizationId} has role ${result.membership.role}`,
    );

    const token = generateJWT({
      userId: result.user.id,

      organizationId: result.membership.organizationId,

      role: result.membership.role,
    });

    return {
      action: "accept" as const,

      token,

      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },

      organizationId: result.membership.organizationId,

      role: result.membership.role,
    };
  } catch (error) {
    throw invitationResponseError(error);
  }
};

/* ============================================================
   Reject invitation
   ============================================================ */
export const rejectOrganizationInvite = async (input: RejectInviteInput) => {
  try {
    const respondedAt = new Date();

    const tokenHash = hashInvitationToken(input.token);

    const rejectedInvitation = await prisma.$transaction(async (tx) => {
      let invitation = await findOrganizationInvitationByTokenHash(
        tokenHash,
        tx,
      );

      invitation = validateInvitation(invitation, respondedAt);

      const claimed = await claimOrganizationInvitation(
        {
          id: invitation.id,
          tokenHash: invitation.tokenHash,
          status: "REJECTED",
          respondedAt,
        },
        tx,
      );

      if (claimed.count !== 1) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Invitation is expired or already used",
        });
      }
      return { id: invitation.id, organizationId: invitation.organizationId };
    });

    logger.success(
      `Invitation ${rejectedInvitation.id} rejected for workspace ${rejectedInvitation.organizationId}`,
    );

    return {
      action: "reject" as const,
    };
  } catch (error) {
    throw invitationResponseError(error);
  }
};

export const respondToInvitation = async (
  input: InviteResponseInput,
  signedInUserId?: string,
) => {
  if (input.action === "accept") {
    return acceptOrganizationInvite(input, signedInUserId);
  }

  return rejectOrganizationInvite(input);
};

const validateInvitation = (
  invitation: Awaited<ReturnType<typeof findOrganizationInvitationByTokenHash>>,
  now: Date,
) => {
  if (!invitation) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invitation is invalid",
    });
  }

  if (invitation.status !== "PENDING") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Invitation has already been used",
    });
  }

  if (invitation.expiresAt <= now) {
    // Mark invitation as expired
    logger.info(
      JSON.stringify({ invitationId: invitation.id }),
      "Expired invitation encountered",
    );
    void markInvitationExpired(invitation.id, invitation.tokenHash)
      .then((res) => {
        if (res.count !== 1) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not update invitation to Expired",
          });
        }
      })
      .catch((error: unknown) => {
        logger.error(
          JSON.stringify({
            invitationId: invitation.id,
            ...errorDetails(error),
          }),
          "Failed to mark invitation expired",
        );
      });

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invitation has expired",
    });
  }

  return invitation;
};

/* ============================================================
   Token helpers
   ============================================================ */

const hashInvitationToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

const getInvitationUrl = (token: string) => {
  const origin =
    process.env.WEB_ORIGIN?.split(",")[0]?.trim() || "http://localhost:5173";
  return new URL("/invitation/" + token, origin).href;
};

const generateInvitationToken = () => {
  const token = randomBytes(32).toString("base64url");

  return {
    token,
    tokenHash: hashInvitationToken(token),
  };
};

export const getOrganizationMembers = async (
  organizationId: string,
  role: OrganizationRole,
) => {
  if (!can(role, PERMISSIONS.MEMBER_VIEW)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to view members",
    });
  }

  return findOrganizationMembers({
    where: { organizationId },
    include: {
      user: { select: { name: true, email: true } },
      group: { select: { name: true } },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }, { id: "asc" }],
  });
};

export const getOrganizationGroups = async (
  organizationId: string,
  role: OrganizationRole,
) => {
  if (!can(role, PERMISSIONS.GROUP_VIEW)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to view workspace groups",
    });
  }

  return prisma.organizationGroup.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          members: { where: { organizationId, status: { not: "REMOVED" } } },
        },
      },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
};

export const listOrganizationInvitations = (
  organizationId: string,
  role: OrganizationRole,
) => {
  if (!can(role, PERMISSIONS.MEMBER_INVITATION_VIEW)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You cannot view workspace invitations",
    });
  }
  return prisma.organizationInvitation.findMany({
    where: { organizationId, status: "PENDING" },
    select: { id: true, email: true, role: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });
};

export const manageOrganizationInvitation = async (
  input: { invitationId: string; action: "revoke" | "resend" },
  organizationId: string,
  userId: string,
) => {
  const { invitationId, action } = input;
  const permission =
    action === "revoke"
      ? PERMISSIONS.MEMBER_INVITATION_REVOKE
      : PERMISSIONS.MEMBER_INVITATION_RESEND;
  const { token, tokenHash } = generateInvitationToken();
  const previous = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Organization" WHERE id = ${organizationId} FOR UPDATE`;
    const actor = await findOrganizationMember({ organizationId, userId }, tx);
    if (actor?.status !== "ACTIVE" || !can(actor.role, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot manage workspace invitations",
      });
    }

    const invitation = await tx.organizationInvitation.findFirst({
      where: { id: invitationId, organizationId, status: "PENDING" },
      select: {
        tokenHash: true,
        expiresAt: true,
        group: { select: { organizationId: true } },
      },
    });
    if (!invitation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pending invitation not found",
      });
    }
    if (
      action === "resend" &&
      invitation.group?.organizationId !== organizationId
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "The invitation group is unavailable",
      });
    }

    const { count } = await tx.organizationInvitation.updateMany({
      where: {
        id: invitationId,
        organizationId,
        status: "PENDING",
        tokenHash: invitation.tokenHash,
      },
      data:
        action === "revoke"
          ? { status: "REVOKED", respondedAt: new Date() }
          : {
              tokenHash,
              expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            },
    });
    if (!count) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This invitation has already changed",
      });
    }
    return invitation;
  });

  if (action === "resend") {
    try {
      await emailQueue.add(
        "organization-invitation",
        { invitationId, invitationUrl: getInvitationUrl(token) },
        { jobId: `${invitationId}-${tokenHash}` },
      );
    } catch (cause) {
      await prisma.organizationInvitation.updateMany({
        where: {
          id: invitationId,
          organizationId,
          status: "PENDING",
          tokenHash,
        },
        data: { tokenHash: previous.tokenHash, expiresAt: previous.expiresAt },
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not queue the invitation email. Please try again.",
        cause,
      });
    }
  }
  return { id: invitationId };
};
