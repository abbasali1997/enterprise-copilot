import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import {
  inviteMemberSchema,
  respondToInviteSchema,
} from "../schemas/organization.schema.js";
import { TRPCError } from "@trpc/server";
import { can, PERMISSIONS } from "@enterprise/auth";
import { inviteOrganizationMember } from "../repositories/organization.repository.js";
import { respondToInvitation } from "../services/organization.service.js";

export const organizationRouter = router({
  inviteMember: protectedProcedure
    .input(inviteMemberSchema)
    .mutation(({ ctx, input }) => {
      if (!can(ctx.user.role, PERMISSIONS.MEMBER_INVITE)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to invite members",
        });
      }

      // TODO: Send the raw invitation token in an invitation URL via email.
      return inviteOrganizationMember({
        organizationId: ctx.user.organizationId,
        role: input.role,
        invitedByUserId: ctx.user.id,
        email: input.email,
      });
    }),

  respondToInvite: publicProcedure
    .input(respondToInviteSchema)
    .mutation(async ({ ctx, input }) =>
      respondToInvitation(input, ctx.user?.id),
    ),
});
