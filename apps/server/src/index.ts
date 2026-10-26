import express from "express";
import { randomUUID } from "node:crypto";
import { errorDetails } from "./utils/log-operation.js";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers/index.js";
import { createContext } from "./context.js";
import { logger } from "./utils/logger.js";
import { handleTRPCError } from "./utils/errors.js";

const SERVER_PORT = process.env.SERVER_PORT || 3000;

const app = express();

// Log transport lifecycle without URLs: query strings may contain subscription tokens.
app.use((req, res, next) => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  const startedAt = performance.now();
  logger.info(JSON.stringify({ requestId, method: req.method, event: "started" }), "HTTP");
  res.once("finish", () => {
    logger.info(JSON.stringify({ requestId, method: req.method, status: res.statusCode, durationMs: Math.round(performance.now() - startedAt) }), "HTTP completed");
  });
  res.once("close", () => {
    if (!res.writableFinished) logger.warn(JSON.stringify({ requestId, durationMs: Math.round(performance.now() - startedAt) }), "HTTP connection closed before completion");
  });
  next();
});

// Basic Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * tRPC endpoint
 *
 * Requests will go through:
 *
 * /trpc/user.getAll
 * /trpc/user.create
 * /trpc/chat.sendMessage
 * etc.
 */
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,

    onError({ error, path, ctx }) {
      handleTRPCError(error, path, ctx?.user ?? undefined, ctx?.requestId);
    },
  }),
);

// Server
logger.info("Starting HTTP server", "Server");
app.listen(SERVER_PORT, () => {
  logger.info(`Server is Running on PORT: ${SERVER_PORT}`);
  logger.info(`tRPC endpoint: http://localhost:${SERVER_PORT}/trpc`);
}).on("error", (error) => {
  logger.error(JSON.stringify(errorDetails(error)), "HTTP server failed");
  throw error;
});
