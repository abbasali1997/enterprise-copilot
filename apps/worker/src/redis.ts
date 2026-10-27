import { Redis } from "ioredis";
import { logger } from "./utils/logger.js";

// Import after loading the environment; the exported connection connects lazily.
const createRedisConnection = (
  redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379",
) => {
  const parsedRedisUrl = new URL(redisUrl);
  if (!["redis:", "rediss:"].includes(parsedRedisUrl.protocol)) {
    throw new Error("REDIS_URL must use redis:// or rediss://");
  }

  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
  connection.on("error", (error) =>
    logger.error(`Redis error: ${error.message}`),
  );
  return connection;
};

export const REDIS_CONNECTION = createRedisConnection();
