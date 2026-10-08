import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyToken } from "@enterprise/auth";
import { TRPCError } from "@trpc/server";

export function createContext({ req, res }: CreateExpressContextOptions) {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid Authorization header",
      });
    }

    // Verify Token
    let jwtPayload: ReturnType<typeof verifyToken>;
    try {
      jwtPayload = verifyToken(token);
    } catch (error) {
      if (
        error instanceof Error &&
        ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
          error.name,
        )
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired access token",
          cause: error,
        });
      }
      throw error;
    }

    if (typeof jwtPayload === "string") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token payload",
      });
    }

    return {
      req,
      res,
      user: {
        id: jwtPayload.sub,
        organizationId: jwtPayload.organizationId,
        role: jwtPayload.role,
      },
    };
  }

  return {
    req,
    res,
    user: {},
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
