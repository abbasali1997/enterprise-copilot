import { TRPCError } from "@trpc/server";
import { logger } from "./logger.js";

const stringifyError = (
  code: string,
  message: string | undefined,
  ...args: any[]
) => {
  const rest = args[0];
  let payload = {
    code,
    message,
    ...rest,
  };

  return JSON.stringify(payload, null, "\t");
};

export function handleTRPCError(
  error: TRPCError,
  path?: string,
  user?: { id: string | undefined; organizationId: string },
): void {
  const requestContext = {
    path,
    userId: user?.id,
    organizationId: user?.organizationId,
  };
  switch (error.code) {
    case "UNAUTHORIZED":
      logger.warn(
        stringifyError(error.code, error.message, requestContext),
        "Unauthorized request",
      );
      break;

    case "FORBIDDEN":
      logger.warn(
        stringifyError(error.code, error.message, requestContext),
        "Forbidden request",
      );
      break;

    case "CONFLICT":
      logger.warn(
        stringifyError(error.code, error.message, requestContext),
        "Conflicting request",
      );
      break;

    case "BAD_REQUEST":
      logger.warn(
        stringifyError(error.code, error.message, requestContext),
        "Invalid request",
      );
      break;

    case "NOT_FOUND":
      logger.info(
        stringifyError(error.code, error.message, requestContext),
        "Resource not found",
      );
      break;

    default:
      logger.error(
        stringifyError(error.code, error.message, requestContext),
        "Unhandled tRPC error",
      );
  }
}
