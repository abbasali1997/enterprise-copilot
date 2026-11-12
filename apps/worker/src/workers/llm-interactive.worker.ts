import { QUEUE_NAMES } from "../queue.constants.js";
import {
  failGeneration,
  processLlmInteractiveJob,
} from "../services/llm-interactive.service.js";
import { logger } from "../utils/logger.js";
import { createWorker } from "./create-worker.js";

export const llmInteractiveWorker = createWorker(
  QUEUE_NAMES.llmInteractive,
  processLlmInteractiveJob,
);

// Includes jobs that BullMQ fails after exceeding the stalled-job limit.
llmInteractiveWorker.on("failed", (job, error) => {
  if (job?.name !== "generate-chat") return;
  void failGeneration(job.data.generationId, error).catch(
    (failure: unknown) => {
      logger.error(`Failed to record generation failure: ${String(failure)}`);
    },
  );
});
