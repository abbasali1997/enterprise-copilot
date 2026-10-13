import { prisma } from "@enterprise/db";
import { TRPCError } from "@trpc/server";
import {
  can,
  generateJWT,
  hashPassword,
  PERMISSIONS,
} from "@enterprise/auth";
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
  createOrganizationMember,
  findOrganizationInvitationByTokenHash,
  findOrganizationMember,
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

export const updateOrganizationMember = async (
  input: {
    memberId: string;
    organizationId: string;
    role?: "MEMBER" | "ADMIN";
    membershipStatus?: "ACTIVE" | "SUSPENDED" | "REMOVED";
  },
  signedInUserId: string,
  activeOrganizationId: string,
) => {
  if (input.organizationId !== activeOrganizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Switch to this workspace before managing it",
    });
  }

  if (input.role === undefined && input.membershipStatus === undefined) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Provide a role or membership status to update",
    });
  }

  const signedInMember = await prisma.organizationMember.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: signedInUserId,
      status: "ACTIVE",
      user: { status: "ACTIVE" },
      organization: { status: "ACTIVE" },
    },
  });

  if (!signedInMember) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Your account, workspace, or membership is unavailable or inactive",
    });
  }

  if (!can(signedInMember.role, PERMISSIONS.MEMBER_UPDATE)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to update members",
    });
  }

  if (
    input.membershipStatus &&
    input.membershipStatus !== "ACTIVE" &&
    !can(signedInMember.role, PERMISSIONS.MEMBER_REVOKE)
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to suspend/remove members",
    });
  }

  const targetMember = await prisma.organizationMember.findFirst({
    where: { id: input.memberId, organizationId: input.organizationId },
  });

  if (!targetMember) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Member not found in this workspace",
    });
  }

  if (targetMember.role === "OWNER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Owner memberships cannot be changed through this action",
    });
  }

  const updatedMember = await prisma.organizationMember.update({
    where: {
      id: input.memberId,
      organizationId: input.organizationId,
      role: { not: "OWNER" },
    },
    data: {
      role: input.role,
      status: input.membershipStatus,
    },
  });

  logger.success(
    `Membership ${updatedMember.id} in workspace ${updatedMember.organizationId} updated by user ${signedInUserId}: role ${targetMember.role} -> ${updatedMember.role}, status ${targetMember.status} -> ${updatedMember.status}`,
  );
  return updatedMember;
};

export const inviteOrganizationMember = async (
  input: {
    email: string;
    organizationId: string;
    role: "MEMBER" | "ADMIN";
  },
  signedInUserId: string,
) => {
  const email = normalizeEmail(input.email);

  const inviterMembership = await findOrganizationMember({
    organizationId: input.organizationId,
    userId: signedInUserId,
  });

  if (!inviterMembership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization",
    });
  }

  if (!can(inviterMembership.role, PERMISSIONS.MEMBER_INVITE)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to invite members",
    });
  }

  /*
   * Don't invite somebody who is already a member.
   */
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const existingMembership = await findOrganizationMember({
      organizationId: input.organizationId,
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
    organizationId: input.organizationId,
    email,
  });

  if (existingInvitation) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A pending invitation already exists for this email",
    });
  }

  const { token, tokenHash } = generateInvitationToken();

  const invitation = await createOrganizationInvitation({
    email,
    organizationId: input.organizationId,
    role: input.role,
    invitedByUserId: signedInUserId,
    tokenHash,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  });

  logger.success(
    `Invitation ${invitation.id} created for workspace ${input.organizationId} by user ${signedInUserId} with role ${input.role}`,
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
    markInvitationExpired(invitation.id).then((res) => {
      if (res.count !== 1) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not update invitation to Expired",
        });
      }
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

const generateInvitationToken = () => {
  const token = randomBytes(32).toString("base64url");

  return {
    token,
    tokenHash: hashInvitationToken(token),
  };
};

