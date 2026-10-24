import { z } from "zod";

export const createUploadInputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  contentType: z.literal("application/pdf"),
  fileSize: z.number().int().positive().lt(20 * 1024 * 1024),
});
