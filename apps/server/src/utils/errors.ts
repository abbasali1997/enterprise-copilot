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

export function handleTRPCError(error: TRPCError, path?: string): void {
  switch (error.code) {
    case "UNAUTHORIZED":
      logger.warn(
        stringifyError(error.code, error.message, { path }),
        "Unauthorized request",
      );
      break;

    case "FORBIDDEN":
      logger.warn(
        stringifyError(error.code, error.message, { path }),
        "Forbidden request",
      );
      break;

    case "BAD_REQUEST":
      logger.warn(
        stringifyError(error.code, error.message, { path, cause: error.cause }),
        "Invalid request",
      );
      break;

    case "NOT_FOUND":
      logger.info(
        stringifyError(error.code, error.message, { path }),
        "Resource not found",
      );
      break;

    default:
      logger.error(
        stringifyError(error.code, error.message, { path }),
        "Unhandled tRPC error",
      );
  }
}
