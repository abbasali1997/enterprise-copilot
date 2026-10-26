import {
  createUploadInputSchema,
  finalizeUploadInputSchema,
  viewUploadInputSchema,
} from "../schemas/document.schema.js";
import {
  createUpload,
  finalizeUpload,
  getDocuments,
  viewUpload,
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

  viewDocument: tenantProcedure
    .input(viewUploadInputSchema)
    .query(({ input, ctx }) =>
      viewUpload(input.attachmentId, ctx.organizationId, ctx.role),
    ),
});
