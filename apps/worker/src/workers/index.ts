import { llmInteractiveWorker } from "./llm-interactive.worker.js";
import { llmBatchWorker } from "./llm-batch.worker.js";
import { documentWorker } from "./document.worker.js";
import { emailWorker } from "./email.worker.js";
import { systemWorker } from "./system.worker.js";

export const workers = [llmInteractiveWorker, llmBatchWorker, documentWorker, emailWorker, systemWorker];
