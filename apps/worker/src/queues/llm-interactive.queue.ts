import { Queue } from "bullmq";
import { QUEUE_NAMES } from "../queue.constants.js";
import { REDIS_CONNECTION } from "../redis.js";
import { logger } from "../utils/logger.js";
import type { ChatGenerationJob } from "../job-inputs.js";

// Producers fail promptly if Redis is unavailable; workers keep retrying.
const connection = REDIS_CONNECTION.duplicate({
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});

export const llmInteractiveQueue = new Queue<ChatGenerationJob>(
  QUEUE_NAMES.llmInteractive,
  {
    connection,
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    },
  },
);

connection.on("error", (error) =>
  logger.error(error.message, "LLM queue producer"),
);

llmInteractiveQueue.on("error", (error) =>
  logger.error(error.message, "LLM queue producer"),
);
