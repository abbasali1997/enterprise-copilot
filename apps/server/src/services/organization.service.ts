import type { AuthResponse } from "../types/auth.type.js";
import { type Prisma, prisma } from "@enterprise/db";
import { TRPCError } from "@trpc/server";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  ORGANIZATION_ROLES,
  can,
  generateJWT,
  PERMISSIONS,
  verifyWorkspaceSelectionToken,
} from "@enterprise/auth";
import type { SelectOrganizationInput } from "../types/organization.type.js";
import {
  countOrganizationsByName,
  createOrganizationRecord,
  findOrganization,
  findOrganizationMembers,
} from "../repositories/organization.repository.js";
import { findUserById } from "../repositories/user.repository.js";

export const findOne = async (
  id: string,
  userId: string,
  activeOrganizationId: string,
) => {
  const user = await findUserById(userId);
  if (!user || user.status !== "ACTIVE") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Your account is unavailable or suspended",
    });
  }
  if (id !== activeOrganizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Switch to this workspace before managing it",
    });
  }

  const allowedRoles = ORGANIZATION_ROLES.filter((role) =>
    can(role, PERMISSIONS.ORGANIZATION_VIEW),
  );

  const authorizedMember = {
    userId,
    status: "ACTIVE",
    role: { in: allowedRoles },
    user: { status: "ACTIVE" },
  } satisfies Prisma.OrganizationMemberWhereInput;

  const organization = await findOrganization({
    where: {
      id,
      status: "ACTIVE",
      members: {
        some: authorizedMember,
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: {
          role: "asc",
        },
      },
    },
  });

  if (!organization) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Organization is unavailable or you do not have permission to manage it",
    });
  }

  return organization;
};

export const listUserOrganizations = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user || user.status !== "ACTIVE")
    throw new TRPCError({ code: "UNAUTHORIZED" });

  const memberships = await findOrganizationMembers({
    where: { userId, status: "ACTIVE", organization: { status: "ACTIVE" } },
    include: { organization: true },
    orderBy: { organization: { name: "asc" } },
  });

  return memberships.map(({ organization, role }) => ({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logoUrl: organization.logoUrl,
    role,
  }));
};

export const selectOrganization = async (
  input: SelectOrganizationInput,
  signedInUserId?: string,
): Promise<Extract<AuthResponse, { status: "authenticated" }>> => {
  let userId = signedInUserId;

  if (input.selectionToken) {
    let selection;
    try {
      selection = verifyWorkspaceSelectionToken(input.selectionToken);
    } catch (error) {
      if (
        error instanceof Error &&
        ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
          error.name,
        )
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired workspace selection token",
          cause: error,
        });
      }
      throw error;
    }
    if (userId && userId !== selection.sub) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Selection token belongs to another user",
      });
    }
    userId = selection.sub;
  }

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign in or provide a workspace selection token",
    });
  }

  const user = await findUserById(userId);
  if (!user || user.status !== "ACTIVE") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Your account is unavailable or suspended",
    });
  }

  const memberships = await findOrganizationMembers({
    where: {
      userId: user.id,
      organizationId: input.organizationId,
      status: "ACTIVE",
      organization: { status: "ACTIVE" },
    },
    include: { organization: true },
    take: 1,
  });
  const membership = memberships[0];
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No active membership in this organization",
    });
  }

  return {
    status: "authenticated",
    user: { id: user.id, name: user.name, email: user.email },
    workspace: {
      id: membership.organizationId,
      name: membership.organization.name,
      slug: membership.organization.slug,
      logoUrl: membership.organization.logoUrl,
      role: membership.role,
    },
    accessToken: generateJWT({
      userId: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
    }),
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
};

export const createOrganization = async (
  organizationName: string,
  db: Prisma.TransactionClient = prisma,
) => {
  const name = organizationName.trim();

  const count = await countOrganizationsByName(name, db);

  return createOrganizationRecord(
    {
      name,
      slug: slugify(name, count),
    },
    db,
  );
};

/* ============================================================
   Slug
   ============================================================ */

const slugify = (name: string, count = 0) => {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .concat(count > 0 ? `_${count}` : "");
};
