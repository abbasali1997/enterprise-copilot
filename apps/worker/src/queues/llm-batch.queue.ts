import { Queue } from "bullmq";
import { QUEUE_NAMES } from "../queue.constants.js";
import { REDIS_CONNECTION } from "../redis.js";

export const llmBatchQueue = new Queue(QUEUE_NAMES.llmBatch, {
  connection: REDIS_CONNECTION,
});
