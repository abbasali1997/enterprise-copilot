import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import {
  getLoggedInUser,
  loginUser,
  registerUser,
} from "../services/auth.service.js";

export const authRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => getLoggedInUser(ctx.user.id)),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => loginUser(input)),

  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => registerUser(input)),
});
