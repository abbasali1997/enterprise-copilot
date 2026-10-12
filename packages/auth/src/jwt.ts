import jwt, { type JwtPayload } from "jsonwebtoken";
import type { OrganizationRole } from "./permissions/roles.ts";

const JWT_SECRET = process.env.JWT_SECRET;

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const WORKSPACE_SELECTION_TTL_SECONDS = 5 * 60;

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
    iss: "enterprise-copilot-auth",
    aud: "enterprise-copilot-api",
  };

  return jwt.sign(jwtPayload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
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

export const generateWorkspaceSelectionToken = (userId: string): string => {
  if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");
  return jwt.sign({ sub: userId, purpose: "workspace_selection" }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: WORKSPACE_SELECTION_TTL_SECONDS,
    issuer: "enterprise-copilot-auth",
    audience: "enterprise-copilot-workspace-selection",
  });
};

export const verifyWorkspaceSelectionToken = (
  token: string,
): JwtPayload & {
  sub: string;
  purpose: "workspace_selection";
} => {
  if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");
  const payload = jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: "enterprise-copilot-auth",
    audience: "enterprise-copilot-workspace-selection",
  });
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    payload.purpose !== "workspace_selection"
  ) {
    throw new jwt.JsonWebTokenError("Invalid workspace selection token");
  }
  return payload as JwtPayload & {
    sub: string;
    purpose: "workspace_selection";
  };
};
