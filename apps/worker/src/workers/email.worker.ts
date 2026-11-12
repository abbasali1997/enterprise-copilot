import { QUEUE_NAMES } from "../queue.constants.js";
import { createWorker } from "./create-worker.js";
import { processEmailJob } from "../services/mail.service.js";

export const emailWorker = createWorker(QUEUE_NAMES.email, processEmailJob);
