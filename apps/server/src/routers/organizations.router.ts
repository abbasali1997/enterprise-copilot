import {
  protectedProcedure,
  publicProcedure,
  router,
  tenantProcedure,
} from "../trpc.js";
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
  getOrganizationGroups,
  getOrganizationMembers,
  inviteOrganizationMember,
  respondToInvitation,
  updateOrganizationMember,
} from "../services/organization-membership.service.js";

import { authenticateResponse, setAuthCookie } from "../utils/auth-cookie.js";

export const organizationRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    listUserOrganizations(ctx.user.id),
  ),

  getActive: tenantProcedure.query(({ ctx }) =>
    findOne(ctx.organizationId, ctx.role),
  ),

  getGroups: tenantProcedure.query(({ ctx }) =>
    getOrganizationGroups(ctx.organizationId, ctx.role),
  ),

  getMembers: tenantProcedure.query(({ ctx }) =>
    getOrganizationMembers(ctx.organizationId, ctx.role),
  ),

  changeOrganization: protectedProcedure
    .input(changeOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      return authenticateResponse(
        ctx.res,
        await selectOrganization(input, ctx.user?.id),
      );
    }),

  selectOrganization: publicProcedure
    .input(selectOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      return authenticateResponse(
        ctx.res,
        await selectOrganization(input, ctx.user?.id),
      );
    }),

  inviteMember: tenantProcedure
    .input(inviteMemberSchema)
    .mutation(({ ctx, input }) => {
      // TODO: Send the raw invitation token in an invitation URL via email.
      return inviteOrganizationMember(
        input,
        ctx.user.id,
        ctx.organizationId,
        ctx.role,
      );
    }),

  respondToInvite: publicProcedure
    .input(respondToInviteSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await respondToInvitation(input, ctx.user?.id);
      if (result.action === "accept") {
        const { token, ...response } = result;
        setAuthCookie(ctx.res, token);
        return response;
      }
      return result;
    }),

  updateMember: tenantProcedure
    .input(updateOrganizationMemberSchema)
    .mutation(({ ctx, input }) =>
      updateOrganizationMember(
        input,
        ctx.user.id,
        ctx.organizationId,
        ctx.role,
      ),
    ),
});
