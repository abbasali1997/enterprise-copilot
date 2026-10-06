import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { generateJWT, hashPassword, verifyPassword } from "@enterprise/auth";
import { prisma } from "@enterprise/db";
import {
  createOrganization,
  createOrganizationMember,
} from "../repositories/organization.repository.js";
import { createUser } from "../repositories/user.repository.js";

export const authRouter = router({
  login: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
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

    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId: user.id,
        organizationId: input.organizationId,
        status: "ACTIVE",
        organization: { status: "ACTIVE" },
      },
      take: 2,
    });

    const membership = memberships[0];
    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No active membership in an active organization",
      });
    }

    if (memberships.length > 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Provide organizationId to select an organization",
      });
    }

    const token = generateJWT({
      userId: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
      organizationId: membership.organizationId,
      role: membership.role,
    };
  }),

  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      const { name, email, password, organizationName } = input;

      const passwordHash = hashPassword(password);

      return prisma.$transaction(async (tx) => {
        const newUser = await createUser(
          {
            name,
            email,
            passwordHash,
          },
          tx,
        );

        const newOrganization = await createOrganization(organizationName, tx);

        const newMember = await createOrganizationMember(
          {
            role: "OWNER",
            userId: newUser.id,
            organizationId: newOrganization.id,
          },
          tx,
        );

        const token = generateJWT({
          userId: newUser.id,
          organizationId: newOrganization.id,
          role: newMember.role,
        });

        return {
          token,
          user: { id: newUser.id, email: newUser.email, name: newUser.name },
          organizationId: newOrganization.id,
          role: newMember.role,
        };
      });
    }),
});
