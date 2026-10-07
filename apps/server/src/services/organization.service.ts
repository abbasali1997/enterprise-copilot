import type { InviteResponseInput } from "../types/organization.type.js";
import {
  acceptOrganizationInvite,
  rejectOrganizationInvite,
} from "../repositories/organization.repository.js";

export const respondToInvitation = async (
  input: InviteResponseInput,
  signedInUserId?: string,
) => {
  const { action } = input;

  if (action === "accept") {
    return await acceptOrganizationInvite(input, signedInUserId);
  } else {
    return await rejectOrganizationInvite(input);
  }
};
