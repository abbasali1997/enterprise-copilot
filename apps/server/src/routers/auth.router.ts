import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { generateJWT, hashPassword, verifyPassword } from "@enterprise/auth";
import { Prisma, prisma } from "@enterprise/db";
import { createOrganizationMember } from "../repositories/organization.repository.js";
import { createUser } from "../repositories/user.repository.js";
import { logger } from "../utils/logger.js";
import { createOrganization } from "../services/organization.service.js";

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

      try {
        const passwordHash = hashPassword(password);

        return await prisma.$transaction(async (tx) => {
          const newUser = await createUser({ name, email, passwordHash }, tx);

          const newOrganization = await createOrganization(
            organizationName,
            tx,
          );

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

          logger.success(
            `New user: ${newUser.name} registered for organization: ${newOrganization.slug}`,
          );

          return {
            token,
            user: { id: newUser.id, email: newUser.email, name: newUser.name },
            organizationId: newOrganization.id,
            role: newMember.role,
          };
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const target = error.meta?.target;
          const isEmailConflict = Array.isArray(target)
            ? target.includes("email")
            : typeof target === "string" && target.includes("email");

          throw new TRPCError({
            code: "CONFLICT",
            message: isEmailConflict
              ? "An account with this email already exists"
              : "Registration conflicts with an existing record",
            cause: error,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to register. Please try again later.",
          cause: error,
        });
      }
    }),
});
