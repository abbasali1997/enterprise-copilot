import { z } from "zod";
import type {
  respondToInviteSchema,
  selectOrganizationSchema,
} from "../schemas/organization.schema.js";

export type InviteResponseInput = z.infer<typeof respondToInviteSchema>;
export type AcceptInviteInput = Extract<
  InviteResponseInput,
  { action: "accept" }
>;
export type RejectInviteInput = Extract<
  InviteResponseInput,
  { action: "reject" }
>;

export type SelectOrganizationInput = z.infer<typeof selectOrganizationSchema>;
