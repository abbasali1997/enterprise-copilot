import {protectedProcedure, router} from "../trpc.js";

export const userRouter = router({
  getAll: protectedProcedure.query(() => {})
});