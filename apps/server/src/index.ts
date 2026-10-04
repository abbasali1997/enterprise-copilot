import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers/index.js";
import { createContext } from "./context.js";

const SERVER_PORT = process.env.SERVER_PORT || 3000;

const app = express();

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
  }),
);

// Server
app.listen(SERVER_PORT, () => {
  // Todo: Add logger
  console.log("Server is Running on PORT: ", SERVER_PORT);
  console.log(`tRPC endpoint: http://localhost:${SERVER_PORT}/trpc`);
});
