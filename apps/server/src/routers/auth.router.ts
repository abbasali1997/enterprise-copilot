import { tenantProcedure, publicProcedure, router } from "../trpc.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import {
  getLoggedInUser,
  loginUser,
  registerUser,
} from "../services/auth.service.js";

import {
  authenticateResponse,
  clearAuthCookie,
  setAuthCookie,
} from "../utils/auth-cookie.js";

export const authRouter = router({
  me: tenantProcedure.query(async ({ ctx }) =>
    getLoggedInUser(ctx.user.id, ctx.membership),
  ),

  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const result = await loginUser(input);
    if (result.status === "authenticated")
      return authenticateResponse(ctx.res, result);
    clearAuthCookie(ctx.res);
    return result;
  }),

  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const { token, ...response } = await registerUser(input);
      setAuthCookie(ctx.res, token);
      return response;
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    clearAuthCookie(ctx.res);
    return { success: true };
  }),
});
