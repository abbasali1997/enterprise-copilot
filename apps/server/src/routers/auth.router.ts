import { tenantProcedure, publicProcedure, router } from "../trpc.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import {
  getLoggedInUser,
  loginUser,
  registerUser,
} from "../services/auth.service.js";

export const authRouter = router({
  me: tenantProcedure.query(async ({ ctx }) =>
    getLoggedInUser(ctx.user.id, ctx.membership),
  ),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => loginUser(input)),

  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => registerUser(input)),
});
