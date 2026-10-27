import { Queue } from "bullmq";
import { QUEUE_NAMES } from "../queue.constants.js";
import { REDIS_CONNECTION } from "../redis.js";

export const systemQueue = new Queue(QUEUE_NAMES.system, {
  connection: REDIS_CONNECTION,
});
