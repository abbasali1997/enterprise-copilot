import { createHash, randomBytes } from "node:crypto";

export const generateInvitationToken = (): string => {
  const token = randomBytes(32).toString("base64url");

  return createHash("sha256").update(token).digest("hex");
};
