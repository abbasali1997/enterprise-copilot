import { Queue } from "bullmq";
import { QUEUE_NAMES } from "../queue.constants.js";
import { REDIS_CONNECTION } from "../redis.js";

export const documentQueue = new Queue(QUEUE_NAMES.documents, {
  connection: REDIS_CONNECTION,
});
