import { documentRouter } from "./documents.router.js";
import { router } from "../trpc.js";
import { userRouter } from "./users.router.js";
import { healthRouter } from "./health.router.js";
import { authRouter } from "./auth.router.js";
import { organizationRouter } from "./organizations.router.js";
import { conversationRouter } from "./conversation.router.js";
import { assistantRouter } from "./assistants.router.js";

export const appRouter = router({
  documents: documentRouter,
  health: healthRouter,
  auth: authRouter,
  user: userRouter,
  organization: organizationRouter,
  conversation: conversationRouter,
  chat: conversationRouter,
  assistant: assistantRouter,
});

export type AppRouter = typeof appRouter;
