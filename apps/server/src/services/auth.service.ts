import type { LoginInput, RegisterInput } from "../types/auth.type.js";
import { generateJWT, hashPassword, verifyPassword } from "@enterprise/auth";
import { prisma } from "@enterprise/db";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
} from "../repositories/user.repository.js";
import { createOrganization } from "./organization.service.js";
import {
  createOrganizationMember,
  findOrganizationMembers,
} from "../repositories/organization.repository.js";
import { logger } from "../utils/logger.js";
import { registerResponseError } from "../error-handlers/auth.errorHandler.js";
import { TRPCError } from "@trpc/server";
import { normalizeEmail } from "../utils/helpers.js";

export const getLoggedInUser = async (userId: string) => {
  const user = await findUserById(userId);

  if (!user || user.status !== "ACTIVE") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Your account is unavailable or inactive",
    });
  }

  return { id: user.id, email: user.email, name: user.name };
};

export const loginUser = async (input: LoginInput) => {
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
      organizationId: input.organizationId,
      status: "ACTIVE",
      organization: { status: "ACTIVE" },
    },
    take: 2,
  });

  if (memberships.length === 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No active membership in an active organization",
    });
  }

  if (!input.organizationId && memberships.length > 1) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Provide organizationId to select an organization",
    });
  }

  const membership = memberships[0]!;
  const token = generateJWT({
    userId: user.id,
    organizationId: membership.organizationId,
    role: membership.role,
  });

  await updateUser({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  logger.success(`User "${user.name}" logged in.`);

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name },
    organizationId: membership.organizationId,
    role: membership.role,
  };
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
      `New user: ${newUser.name} registered for organization: ${newOrganization.slug} with membership role as: ${newMember.role}`,
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
