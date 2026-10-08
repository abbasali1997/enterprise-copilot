import jwt, { type JwtPayload } from "jsonwebtoken";
import type { OrganizationRole } from "./permissions/roles.ts";

const JWT_SECRET = process.env.JWT_SECRET;

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
  if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }

  const jwtPayload: ExtendedJWTPayload = {
    sub: userId,
    organizationId,
    role,
    sid: "session_789",
    iss: "enterprise-copilot-auth",
    aud: "enterprise-copilot-api",
  };

  return jwt.sign(jwtPayload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "15m",
  });
};

export const verifyToken = (token: string): string | ExtendedJWTPayload => {
  if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }

  const payload = jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: "enterprise-copilot-auth",
    audience: "enterprise-copilot-api",
  });

  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    typeof payload.organizationId !== "string" ||
    !payload.organizationId ||
    !["OWNER", "ADMIN", "MEMBER"].includes(payload.role)
  ) {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }

  return payload as ExtendedJWTPayload;
};
