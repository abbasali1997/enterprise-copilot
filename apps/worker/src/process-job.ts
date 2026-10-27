import { logger } from "./utils/logger.js";
import { UnrecoverableError, type Job } from "bullmq";

export const processJob = async (job: Job<unknown>) => {
  switch (job.name) {
    case "ping":
      return { status: "ok" };
    default:
      logger.info(job.name);
      // Register document ingestion and workflow processors here as implemented.
      throw new UnrecoverableError(
        `No processor registered for job '${job.name}'`,
      );
  }
};
