import { getMembership } from "./repositories/organization-membership.repository.js";
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context.js";

const t = initTRPC.context<Context>().create();

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user?.id || !ctx.user.organizationId || !ctx.user.role) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: {
        id: ctx.user.id,
        organizationId: ctx.user.organizationId,
        role: ctx.user.role,
      },
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);

export const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const membership = await getMembership(ctx.user.id, ctx.user.organizationId);
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Your account, workspace, or membership is unavailable or inactive",
    });
  }
  return next({
    ctx: {
      ...ctx,
      organizationId: membership.organizationId,
      role: membership.role,
      membership,
    },
  });
});
