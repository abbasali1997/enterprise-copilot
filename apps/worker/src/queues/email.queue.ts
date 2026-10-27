import { Queue } from "bullmq";
import { QUEUE_NAMES } from "../queue.constants.js";
import { REDIS_CONNECTION } from "../redis.js";

export const emailQueue = new Queue(QUEUE_NAMES.email, {
  connection: REDIS_CONNECTION,
});
