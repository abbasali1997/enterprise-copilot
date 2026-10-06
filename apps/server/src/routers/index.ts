import { router } from "../trpc.js";
import { userRouter } from "./users.router.js";
import { healthRouter } from "./health.router.js";
import { authRouter } from "./auth.router.js";

export const appRouter = router({
  health: healthRouter,
  authRouter: authRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
