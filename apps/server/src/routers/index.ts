import { router } from "../trpc.js";
import { userRouter } from "./users.router.js";
import { healthRouter } from "./health.router.js";
import { authRouter } from "./auth.router.js";
import { organizationRouter } from "./organizations.router.js";
import { conversationRouter } from "./conversation.router.js";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  user: userRouter,
  organization: organizationRouter,
  conversation: conversationRouter,
  chat: conversationRouter,
});

export type AppRouter = typeof appRouter;
