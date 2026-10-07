import { protectedProcedure, router } from "../trpc.js";
import { inviteMemberSchema } from "../schemas/organization.schema.js";
import { TRPCError } from "@trpc/server";
import { can, PERMISSIONS } from "@enterprise/auth";
import { inviteOrganizationMember } from "../repositories/organization.repository.js";

export const organizationRouter = router({
  inviteMember: protectedProcedure
    .input(inviteMemberSchema)
    .mutation(({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No user found in the request context",
        });
      }

      const signedInUser = ctx.user;

      if (!can(signedInUser.role, PERMISSIONS.MEMBER_INVITE)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You do not have permission to use this route",
        });
      }

      // Generate an invitation for the specified email
      // TODO: Send invitation url via email

      return inviteOrganizationMember({
        organizationId: signedInUser.organizationId,
        role: input.role,
        invitedById: signedInUser.id,
        email: input.email,
      });
    }),
});
