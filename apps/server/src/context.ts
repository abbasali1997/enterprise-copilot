import { readAuthCookie } from "./utils/auth-cookie.js";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { randomUUID } from "node:crypto";
import { logger } from "./utils/logger.js";
import { errorDetails } from "./utils/log-operation.js";
import { verifyToken } from "@enterprise/auth";

export function createContext({ req, res }: CreateExpressContextOptions) {
  const requestId: string = res.locals.requestId ?? randomUUID();
  const anonymousContext = { req, res, requestId, user: null };
  const token = readAuthCookie(req);
  if (!token) return anonymousContext;

  try {
    const jwtPayload = verifyToken(token);
    if (typeof jwtPayload === "string") return anonymousContext;
    return {
      req,
      res,
      requestId,
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
      logger.warn(
        JSON.stringify({ requestId, ...errorDetails(error) }),
        "Authentication",
      );
      // Authentication is optional here; protectedProcedure enforces it.
      return anonymousContext;
    }
    logger.error(
      JSON.stringify({ requestId, ...errorDetails(error) }),
      "Authentication context failed",
    );
    // Configuration and unexpected server failures must remain visible.
    throw error;
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
