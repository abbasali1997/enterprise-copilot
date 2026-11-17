import { z } from "zod";

export const changeOrganizationSchema = z.object({
  organizationId: z.string().trim().uuid(),
});

export const selectOrganizationSchema = z.object({
  organizationId: z.string().trim().uuid(),
  selectionToken: z.string().min(1),
});

export const inviteMemberSchema = z.object({
  groupId: z.string().trim().uuid(),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const respondToInviteSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("accept"),
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    name: z.string().trim().min(2).max(100).optional(),
    password: z.string().min(8).max(128).optional(),
  }),
  z.object({
    action: z.literal("reject"),
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  }),
]);

export const updateOrganizationMemberSchema = z
  .object({
    memberId: z.string().trim().uuid(),
    role: z.enum(["ADMIN", "MEMBER"]).optional(),
    groupId: z.string().trim().uuid().optional(),
    membershipStatus: z.enum(["ACTIVE", "SUSPENDED", "REMOVED"]).optional(),
  })
  .refine(
    (input) =>
      input.role !== undefined ||
      input.membershipStatus !== undefined ||
      input.groupId !== undefined,
    { message: "Provide member details to update" },
  );

export const createOrganizationGroupSchema = z.object({
  name: z.string().trim().min(1, "Enter a group name").max(100),
});
