import {
  createOrganizationMember,
  findOrganizationMembers,
} from "../repositories/organization-membership.repository.js";
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
} from "../types/auth.type.js";
import {
  generateJWT,
  generateWorkspaceSelectionToken,
  hashPassword,
  verifyPassword,
  ACCESS_TOKEN_TTL_SECONDS,
  WORKSPACE_SELECTION_TTL_SECONDS,
} from "@enterprise/auth";
import { prisma } from "@enterprise/db";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
} from "../repositories/user.repository.js";
import { createOrganization } from "./organization.service.js";
import { logger } from "../utils/logger.js";
import { registerResponseError } from "../error-handlers/auth.errorHandler.js";
import { TRPCError } from "@trpc/server";
import { normalizeEmail } from "../utils/helpers.js";

export const getLoggedInUser = async (
  userId: string,
  organizationId: string,
) => {
  const user = await findUserById(userId);

  if (!user || user.status !== "ACTIVE") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Your account is unavailable or suspended",
    });
  }

  const memberships = await findOrganizationMembers({
    where: {
      userId,
      organizationId,
      status: "ACTIVE",
      organization: { status: "ACTIVE" },
    },
    include: { organization: true },
    take: 1,
  });
  const membership = memberships[0];
  if (!membership) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Your organization membership is unavailable or inactive",
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    organization: {
      id: membership.organizationId,
      name: membership.organization.name,
      slug: membership.organization.slug,
      logoUrl: membership.organization.logoUrl,
      role: membership.role,
    },
  };
};

export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  const normalizedEmail = normalizeEmail(input.email);

  const user = await findUserByEmail(normalizedEmail);

  const passwordValid = user
    ? verifyPassword(input.password, user.passwordHash)
    : false;

  if (!user || !passwordValid) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
  }

  if (user.status !== "ACTIVE") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your account is not active",
    });
  }

  const memberships = await findOrganizationMembers({
    where: {
      userId: user.id,
      status: "ACTIVE",
      organization: { status: "ACTIVE" },
    },
    include: {
      organization: true,
    },
  });

  if (memberships.length === 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No active membership in an active organization",
    });
  }

  const safeUser = { id: user.id, email: user.email, name: user.name };
  const toWorkspace = (membership: (typeof memberships)[number]) => ({
    id: membership.organizationId,
    role: membership.role,
    name: membership.organization.name,
    slug: membership.organization.slug,
    logoUrl: membership.organization.logoUrl,
  });

  const membership = memberships[0];
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No active membership in an active organization",
    });
  }

  const response: AuthResponse =
    memberships.length === 1
      ? {
          status: "authenticated",
          user: safeUser,
          workspace: toWorkspace(membership),
          accessToken: generateJWT({
            userId: user.id,
            organizationId: membership.organizationId,
            role: membership.role,
          }),
          expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        }
      : {
          status: "workspace_selection_required",
          user: safeUser,
          workspaces: memberships.map(toWorkspace),
          selectionToken: generateWorkspaceSelectionToken(user.id),
          expiresIn: WORKSPACE_SELECTION_TTL_SECONDS,
        };

  await updateUser({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  logger.success(
    `User ${user.id} authenticated; result ${response.status}; active workspaces ${memberships.length}`,
  );
  return response;
};

export const registerUser = async (input: RegisterInput) => {
  try {
    const { name, email, password, organizationName } = input;

    const passwordHash = hashPassword(password);

    const res = await prisma.$transaction(async (tx) => {
      const newUser = await createUser({ name, email, passwordHash }, tx);
      const newOrganization = await createOrganization(organizationName, tx);
      const newMember = await createOrganizationMember(
        {
          role: "OWNER",
          userId: newUser.id,
          organizationId: newOrganization.id,
        },
        tx,
      );

      return {
        newUser,
        newOrganization,
        newMember,
      };
    });

    const { newUser, newOrganization, newMember } = res;

    const token = generateJWT({
      userId: newUser.id,
      organizationId: newOrganization.id,
      role: newMember.role,
    });

    logger.success(
      `User ${newUser.id} registered with workspace ${newOrganization.id} and membership ${newMember.id} as ${newMember.role}`,
    );

    return {
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      organizationId: newOrganization.id,
      role: newMember.role,
    };
  } catch (error) {
    throw registerResponseError(error);
  }
};
