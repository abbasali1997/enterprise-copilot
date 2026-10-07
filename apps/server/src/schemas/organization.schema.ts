import { z } from "zod";

export const inviteMemberSchema = z.object({
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
