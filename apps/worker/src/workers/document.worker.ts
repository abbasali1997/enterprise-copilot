import { type Job } from "bullmq";
import { QUEUE_NAMES } from "../queue.constants.js";
import { processJob } from "../process-job.js";
import { createWorker } from "./create-worker.js";

// Add handlers for this queue here.
export const processDocumentJob = async (job: Job<unknown>) => processJob(job);

export const documentWorker = createWorker(QUEUE_NAMES.documents, processDocumentJob);
