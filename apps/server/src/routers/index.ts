import { router } from "../trpc.js";
import { userRouter } from "./users.router.js";
import { healthRouter } from "./health.router.js";

export const appRouter = router({
  health: healthRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
