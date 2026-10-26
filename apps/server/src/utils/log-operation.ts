import { TRPCError } from "@trpc/server";
import { logger } from "./logger.js";

// Keep raw exception messages, inputs, and provider responses out of operational logs.
export const errorDetails = (error: unknown) => ({
  errorType: error instanceof Error ? error.name : "UnknownError",
  code: error instanceof TRPCError ? error.code : undefined,
});

export async function logOperation<T>(
  operation: string,
  metadata: Record<string, string | number | undefined>,
  action: () => Promise<T>,
): Promise<T> {
  const startedAt = performance.now();
  logger.info(JSON.stringify({ operation, ...metadata, event: "started" }), "Operation");
  try {
    const result = await action();
    logger.info(JSON.stringify({ operation, ...metadata, event: "completed", durationMs: Math.round(performance.now() - startedAt) }), "Operation");
    return result;
  } catch (error) {
    const message = JSON.stringify({ operation, ...metadata, event: "failed", durationMs: Math.round(performance.now() - startedAt), ...errorDetails(error) });
    if (error instanceof TRPCError && error.code !== "INTERNAL_SERVER_ERROR") {
      logger.warn(message, "Operation");
    } else {
      logger.error(message, "Operation");
    }
    throw error;
  }
}
