import type { OrganizationRole } from "@enterprise/auth";
import { can, PERMISSIONS } from "@enterprise/auth";
import { prisma } from "@enterprise/db";
import { TRPCError } from "@trpc/server";
import {
  findOrganizationMember,
  findOne as findOrganizationMemberRecord,
  updateOrganizationMemberRecord,
} from "../repositories/organization-membership.repository.js";

export const updateOrganizationMember = async (
  input: {
    memberId: string;
    role?: OrganizationRole;
    groupId?: string | null;
    membershipStatus?: "ACTIVE" | "SUSPENDED" | "REMOVED";
  },
  signedInUserId: string,
  organizationId: string,
  db: Pick<typeof prisma, "$transaction"> = prisma,
) =>
  db.$transaction(async (tx) => {
    // Serialize changes in a workspace before reading the actor and active owner count.
    await tx.$queryRaw`SELECT id FROM "Organization" WHERE id = ${organizationId} FOR UPDATE`;
    const actor = await findOrganizationMember(
      { organizationId, userId: signedInUserId },
      tx,
    );
    if (actor?.status !== "ACTIVE" || actor.role === "MEMBER") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot manage workspace memberships",
      });
    }

    const target = await findOrganizationMemberRecord(
      {
        where: { id: input.memberId, organizationId },
      },
      tx,
    );
    if (!target) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Member not found in this workspace",
      });
    }

    if (
      actor.role === "ADMIN" &&
      (actor.id === target.id ||
        target.role === "OWNER" ||
        input.role === "OWNER" ||
        (input.membershipStatus !== undefined && target.role !== "MEMBER"))
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot make this membership change",
      });
    }

    const statusPermissions = {
      ACTIVE: PERMISSIONS.MEMBER_REACTIVATE,
      SUSPENDED: PERMISSIONS.MEMBER_SUSPEND,
      REMOVED: PERMISSIONS.MEMBER_REMOVE,
    } as const;
    if (
      (input.role !== undefined &&
        !can(actor.role, PERMISSIONS.MEMBER_ROLE_UPDATE)) ||
      (input.groupId === null &&
        !can(actor.role, PERMISSIONS.GROUP_MEMBER_REMOVE)) ||
      (typeof input.groupId === "string" &&
        !can(actor.role, PERMISSIONS.GROUP_MEMBER_ADD)) ||
      (input.membershipStatus !== undefined &&
        !can(actor.role, statusPermissions[input.membershipStatus]))
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot make this membership change",
      });
    }

    if (
      target.role === "OWNER" &&
      target.status === "ACTIVE" &&
      ((input.role ?? target.role) !== "OWNER" ||
        (input.membershipStatus ?? target.status) !== "ACTIVE")
    ) {
      const otherOwners = await tx.organizationMember.count({
        where: {
          organizationId,
          role: "OWNER",
          status: "ACTIVE",
          id: { not: target.id },
        },
      });
      if (!otherOwners) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "The workspace must keep at least one active owner",
        });
      }
    }

    if (
      typeof input.groupId === "string" &&
      !(await tx.organizationGroup.findFirst({
        where: { id: input.groupId, organizationId },
        select: { id: true },
      }))
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Group not found in this workspace",
      });
    }

    return updateOrganizationMemberRecord(
      {
        where: { id: target.id, organizationId },
        data: {
          role: input.role,
          status: input.membershipStatus,
          groupId: input.groupId,
        },
      },
      tx,
    );
  });
