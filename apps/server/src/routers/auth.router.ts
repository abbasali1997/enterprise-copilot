import { publicProcedure, router } from "../trpc.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { loginUser, registerUser } from "../services/auth.service.js";

export const authRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => loginUser(input)),

  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => registerUser(input)),
});
