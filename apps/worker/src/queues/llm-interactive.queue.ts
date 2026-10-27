import { Queue } from "bullmq";
import { QUEUE_NAMES } from "../queue.constants.js";
import { REDIS_CONNECTION } from "../redis.js";

export const llmInteractiveQueue = new Queue(QUEUE_NAMES.llmInteractive, {
  connection: REDIS_CONNECTION,
});
