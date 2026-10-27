import { Worker, type Processor } from "bullmq";
import type { QueueName } from "../queue.constants.js";
import { REDIS_CONNECTION } from "../redis.js";
import { logger } from "../utils/logger.js";

export const createWorker = (queueName: QueueName, processor: Processor) => {
  const setting = `${queueName.toUpperCase().replaceAll("-", "_")}_CONCURRENCY`;
  const concurrency = Number(process.env[setting] ?? process.env.WORKER_CONCURRENCY ?? "5");
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new Error(`${setting} must be a positive integer`);
  }
  const worker = new Worker(queueName, processor, {
    connection: REDIS_CONNECTION,
    concurrency,
    autorun: false,
  });
  worker.on("ready", () => logger.info(`Listening with concurrency ${concurrency}`, queueName));
  worker.on("active", (job) => logger.info(`Started job ${job.id} (${job.name})`, queueName));
  worker.on("completed", (job) => logger.info(`Completed job ${job.id} (${job.name})`, queueName));
  worker.on("failed", (job, error) => logger.error(`Failed job ${job?.id ?? "unknown"}: ${error.message}`, queueName));
  worker.on("stalled", (jobId) => logger.warn(`Job ${jobId} stalled`, queueName));
  worker.on("error", (error) => logger.error(error.message, queueName));
  return worker;
};
