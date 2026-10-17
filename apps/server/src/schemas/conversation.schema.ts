import { z } from "zod";

export const sendMessageInputSchema = z.object({
  conversationId: z.string().trim().uuid().optional(),
  assistantId: z.string().trim().uuid().optional(),
  content: z.string().trim().min(1),
});
