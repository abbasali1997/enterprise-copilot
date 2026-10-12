import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyToken } from "@enterprise/auth";

export function createContext({ req, res }: CreateExpressContextOptions) {
  const anonymousContext = { req, res, user: null };

  const authHeader = req.headers.authorization;
  if (!authHeader) return anonymousContext;

  const match = /^Bearer\s+(\S+)$/i.exec(authHeader.trim());
  const token = match?.[1];
  if (!token) return anonymousContext;

  try {
    const jwtPayload = verifyToken(token);
    if (typeof jwtPayload === "string") return anonymousContext;

    return {
      req,
      res,
      user: {
        id: jwtPayload.sub,
        organizationId: jwtPayload.organizationId,
        role: jwtPayload.role,
      },
    };
  } catch (error) {
    if (
      error instanceof Error &&
      ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
        error.name,
      )
    ) {
      // Authentication is optional here; protectedProcedure enforces it.
      return anonymousContext;
    }
    // Configuration and unexpected server failures must remain visible.
    throw error;
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
