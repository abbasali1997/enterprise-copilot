import type { OrganizationRole } from "@enterprise/auth";
import { can, PERMISSIONS } from "@enterprise/auth";
import { prisma } from "@enterprise/db";
import { TRPCError } from "@trpc/server";

export const createOrganizationGroup = async (
  input: { name: string },
  organizationId: string,
  role: OrganizationRole,
) => {
  if (!can(role, PERMISSIONS.GROUP_CREATE)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to create workspace groups",
    });
  }
  try {
    return await prisma.organizationGroup.create({
      data: { name: input.name, organizationId },
      select: { id: true, name: true },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This group name is unavailable. Choose another name.",
      });
    }
    throw error;
  }
};
