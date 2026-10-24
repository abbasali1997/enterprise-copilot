import { createUploadInputSchema } from "../schemas/document.schema.js";
import { createUpload } from "../services/document.service.js";
import { router, tenantProcedure } from "../trpc.js";

export const documentRouter = router({
  createUpload: tenantProcedure
    .input(createUploadInputSchema)
    .mutation(({ input, ctx }) =>
      createUpload(input, ctx.user.id, ctx.organizationId, ctx.role),
    ),
});
