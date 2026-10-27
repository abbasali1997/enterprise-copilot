import { Queue } from "bullmq";
import { QUEUE_NAMES } from "../queue.constants.js";
import { REDIS_CONNECTION } from "../redis.js";
import { logger } from "../utils/logger.js";

const connection = REDIS_CONNECTION.duplicate({
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});

export const documentQueue = new Queue(QUEUE_NAMES.documents, {
  connection: connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

connection.on("error", (error) =>
  logger.error(error.message, "LLM queue producer"),
);

documentQueue.on("error", (error) =>
  logger.error(error.message, "Document queue producer"),
);
