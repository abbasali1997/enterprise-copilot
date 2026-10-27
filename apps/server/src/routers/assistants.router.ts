import { router, tenantProcedure } from "../trpc.js";
import { getAvailableModels } from "../services/assistant.service.js";

export const assistantRouter = router({
  models: tenantProcedure.query(({ ctx }) => getAvailableModels(ctx.role)),
});
