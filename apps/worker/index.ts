import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { logger } from "./src/utils/logger.js";

config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
});

// Load Redis and the five queue workers after environment configuration.
const { workers } = await import("./src/workers/index.js");
const { REDIS_CONNECTION: connection } = await import("./src/redis.js");

let shuttingDown = false;
const shutdown = async (reason: string, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = exitCode;
  logger.info(`Shutting down: ${reason}`);

  const timeout = setTimeout(() => {
    logger.error("Graceful shutdown timed out");
    connection.disconnect();
    process.exit(1);
  }, 30_000);
  timeout.unref();

  try {
    const results = await Promise.allSettled(
      workers.map((worker) => worker.close()),
    );
    for (const result of results) {
      if (result.status === "rejected") {
        process.exitCode = 1;
        logger.error(`Shutdown failed: ${String(result.reason)}`);
      }
    }
    logger.info("Shutdown complete");
  } finally {
    connection.disconnect();
    clearTimeout(timeout);
  }
};

process.once("SIGINT", () => { void shutdown("SIGINT"); });
process.once("SIGTERM", () => { void shutdown("SIGTERM"); });

for (const worker of workers) {
  void worker.run().catch(async (error: unknown) => {
    logger.error(
      `Worker '${worker.name}' stopped: ${error instanceof Error ? error.message : String(error)}`,
    );
    await shutdown("Worker failure", 1);
  });
}
