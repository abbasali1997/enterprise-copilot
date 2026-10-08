import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { Worker, UnrecoverableError, type Job } from "bullmq";
import { Redis } from "ioredis";

// Resolve the root environment independently of the process working directory.
config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
});

const queueName = process.env.WORKER_QUEUE_NAME ?? "documents";
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? "5");
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

if (!queueName.trim() || queueName.includes(":")) {
  throw new Error(
    "WORKER_QUEUE_NAME must be nonempty and must not contain ':'",
  );
}
if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
  throw new Error("WORKER_CONCURRENCY must be a positive integer");
}
const parsedRedisUrl = new URL(redisUrl);
if (!["redis:", "rediss:"].includes(parsedRedisUrl.protocol)) {
  throw new Error("REDIS_URL must use redis:// or rediss://");
}

const log = (level: "info" | "error", message: string) => {
  console[level](`${new Date().toISOString()} [worker] ${message}`);
};

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});
connection.on("error", (error) =>
  log("error", `Redis error: ${error.message}`),
);

const processJob = async (job: Job<unknown>) => {
  switch (job.name) {
    case "ping":
      return { status: "ok" };
    default:
      // Register document ingestion and workflow processors here as implemented.
      throw new UnrecoverableError(
        `No processor registered for job '${job.name}'`,
      );
  }
};

const worker = new Worker<unknown>(queueName, processJob, {
  connection,
  concurrency,
  autorun: false,
});

worker.on("ready", () =>
  log(
    "info",
    `Listening on queue '${queueName}' with concurrency ${concurrency}`,
  ),
);
worker.on("active", (job) =>
  log("info", `Started job ${job.id} (${job.name})`),
);
worker.on("completed", (job) =>
  log("info", `Completed job ${job.id} (${job.name})`),
);
worker.on("failed", (job, error) =>
  log("error", `Failed job ${job?.id ?? "unknown"}: ${error.message}`),
);
worker.on("stalled", (jobId) => log("error", `Job ${jobId} stalled`));
worker.on("error", (error) => log("error", `Worker error: ${error.message}`));

let shuttingDown = false;
const shutdown = async (reason: string, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = exitCode;
  log("info", `Shutting down: ${reason}`);

  const timeout = setTimeout(() => {
    log("error", "Graceful shutdown timed out");
    connection.disconnect();
    process.exit(1);
  }, 30_000);
  timeout.unref();

  try {
    // Stop fetching jobs and let active jobs finish before closing Redis.
    await worker.close();
    connection.disconnect();
    log("info", "Shutdown complete");
  } catch (error) {
    process.exitCode = 1;
    log(
      "error",
      `Shutdown failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    connection.disconnect();
  } finally {
    clearTimeout(timeout);
  }
};

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});
process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

void worker.run().catch(async (error: unknown) => {
  log(
    "error",
    `Worker stopped: ${error instanceof Error ? error.message : String(error)}`,
  );
  await shutdown("Worker failure", 1);
});
