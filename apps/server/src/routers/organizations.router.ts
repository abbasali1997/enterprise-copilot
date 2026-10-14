import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import {
  changeOrganizationSchema,
  inviteMemberSchema,
  respondToInviteSchema,
  selectOrganizationSchema,
  updateOrganizationMemberSchema,
} from "../schemas/organization.schema.js";
import {
  selectOrganization,
  listUserOrganizations,
  findOne,
} from "../services/organization.service.js";
import {
  inviteOrganizationMember,
  respondToInvitation,
  updateOrganizationMember,
} from "../services/organization-membership.service.js";

export const organizationRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    listUserOrganizations(ctx.user.id),
  ),

  getActive: protectedProcedure.query(({ ctx }) =>
    findOne(ctx.user.id, ctx.user.organizationId),
  ),

  changeOrganization: protectedProcedure
    .input(changeOrganizationSchema)
    .mutation(({ ctx, input }) => {
      return selectOrganization(input, ctx.user?.id);
    }),

  selectOrganization: publicProcedure
    .input(selectOrganizationSchema)
    .mutation(({ ctx, input }) => {
      return selectOrganization(input, ctx.user?.id);
    }),

  inviteMember: protectedProcedure
    .input(inviteMemberSchema)
    .mutation(({ ctx, input }) => {
      // TODO: Send the raw invitation token in an invitation URL via email.
      return inviteOrganizationMember(
        input,
        ctx.user.id,
        ctx.user.organizationId,
      );
    }),

  respondToInvite: publicProcedure
    .input(respondToInviteSchema)
    .mutation(async ({ ctx, input }) =>
      respondToInvitation(input, ctx.user?.id),
    ),

  updateMember: protectedProcedure
    .input(updateOrganizationMemberSchema)
    .mutation(({ ctx, input }) =>
      updateOrganizationMember(input, ctx.user.id, ctx.user.organizationId),
    ),
});
