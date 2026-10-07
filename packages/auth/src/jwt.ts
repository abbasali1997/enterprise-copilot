import jwt, { type JwtPayload } from "jsonwebtoken";
import type { OrganizationRole } from "./permissions/roles.ts";

const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;

interface ExtendedJWTPayload extends JwtPayload {
  organizationId: string;
  role: OrganizationRole;
}

export const generateJWT = ({
  userId,
  organizationId,
  role,
}: {
  userId: string;
  organizationId: string;
  role: OrganizationRole;
}) => {
  if (!JWT_PRIVATE_KEY) {
    throw new Error("Missing JWT key");
  }

  const privateKey = JWT_PRIVATE_KEY.replace(/\\n/g, "\n");

  const jwtPayload: ExtendedJWTPayload = {
    sub: userId,
    organizationId,
    role,
    sid: "session_789",
    iss: "enterprise-copilot-auth",
    aud: "enterprise-copilot-api",
  };

  return jwt.sign(jwtPayload, privateKey, {
    algorithm: "RS256",
    expiresIn: "15m",
  });
};

export const verifyToken = (token: string): string | ExtendedJWTPayload => {
  if (!JWT_PRIVATE_KEY) {
    throw new Error("Missing JWT key");
  }

  return jwt.verify(token, JWT_PRIVATE_KEY) as ExtendedJWTPayload;
};
