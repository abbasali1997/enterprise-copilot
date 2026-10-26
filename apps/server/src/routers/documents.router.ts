import {
  createUploadInputSchema,
  finalizeUploadInputSchema,
} from "../schemas/document.schema.js";
import {
  createUpload,
  finalizeUpload,
  getDocuments,
} from "../services/document.service.js";
import { router, tenantProcedure } from "../trpc.js";

export const documentRouter = router({
  createUpload: tenantProcedure
    .input(createUploadInputSchema)
    .mutation(({ input, ctx }) =>
      createUpload(input, ctx.user.id, ctx.organizationId, ctx.role),
    ),

  finalizeUpload: tenantProcedure
    .input(finalizeUploadInputSchema)
    .mutation(({ input, ctx }) =>
      finalizeUpload(input, ctx.user.id, ctx.organizationId, ctx.role),
    ),

  getDocuments: tenantProcedure.query(({ ctx }) =>
    getDocuments(ctx.organizationId, ctx.role),
  ),
});
