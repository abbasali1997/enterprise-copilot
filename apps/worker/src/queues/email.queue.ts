import { Queue } from "bullmq";
import type { OrganizationInvitationEmailJob } from "../job-inputs.js";
import { QUEUE_NAMES } from "../queue.constants.js";
import { REDIS_CONNECTION } from "../redis.js";
import { logger } from "../utils/logger.js";

const connection = REDIS_CONNECTION.duplicate({
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});

export const emailQueue = new Queue<OrganizationInvitationEmailJob>(QUEUE_NAMES.email, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: { age: 86400 },
  },
});
connection.on("error", (error) => logger.error(error.message, "Email queue producer"));
emailQueue.on("error", (error) => logger.error(error.message, "Email queue producer"));
