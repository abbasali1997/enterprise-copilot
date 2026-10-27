import { type Job } from "bullmq";
import { QUEUE_NAMES } from "../queue.constants.js";
import { processJob } from "../process-job.js";
import { createWorker } from "./create-worker.js";

// Add handlers for this queue here.
export const processSystemJob = async (job: Job<unknown>) => processJob(job);

export const systemWorker = createWorker(QUEUE_NAMES.system, processSystemJob);
