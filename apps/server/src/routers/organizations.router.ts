import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import {
  inviteMemberSchema,
  respondToInviteSchema,
} from "../schemas/organization.schema.js";
import {
  inviteOrganizationMember,
  respondToInvitation,
} from "../services/organization.service.js";

export const organizationRouter = router({
  inviteMember: protectedProcedure
    .input(inviteMemberSchema)
    .mutation(({ ctx, input }) => {
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
