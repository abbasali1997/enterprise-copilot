import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { Queue } from "bullmq";
import { logger } from "./utils/logger.js";

config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url)),
  quiet: true,
});

const action = process.argv[2];
if (!["drain", "completed", "failed", "obliterate"].includes(action ?? "")) {
  throw new Error("Expected drain, completed, failed, or obliterate");
}

const { QUEUE_NAMES } = await import("./queue.constants.js");
const queueName = process.argv[3];
if (!queueName || !Object.values(QUEUE_NAMES).some((name) => name === queueName)) {
  throw new Error(`Specify a queue: ${Object.values(QUEUE_NAMES).join(", ")}`);
}
const { REDIS_CONNECTION: connection } = await import("./redis.js");

// Cleanup commands should fail promptly when Redis is unavailable.
connection.options.maxRetriesPerRequest = 1;
connection.options.retryStrategy = () => null;
const queue = new Queue(queueName, { connection });
queue.on("error", (error) => logger.error(error.message));

try {
  switch (action) {
    case "drain":
      await queue.drain(true);
      logger.success(`Removed waiting and delayed jobs from '${queueName}'`);
      break;
    case "completed":
    case "failed": {
      let total = 0;
      let removed: string[];
      do {
        removed = await queue.clean(0, 1000, action);
        total += removed.length;
      } while (removed.length === 1000);
      logger.success(`Removed ${total} ${action} jobs from '${queueName}'`);
      break;
    }
    case "obliterate":
      // Refuse deletion while jobs are active; stop the worker first.
      await queue.obliterate();
      logger.success(`Deleted queue '${queueName}' and all its jobs`);
      break;
  }
} catch (error) {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  try {
    await queue.close();
  } finally {
    connection.disconnect();
  }
}
