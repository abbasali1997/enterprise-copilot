import { z } from "zod";

export const sendMessageInputSchema = z.object({
  conversationId: z.string().trim().uuid().optional(),
  assistantId: z.string().trim().uuid().optional(),
  content: z.string().trim().min(1),
});

export const getConversationInputSchema = z.object({
  conversationId: z.string().trim().uuid(),
});

export const renameConversationInputSchema = getConversationInputSchema.extend({
  title: z.string().trim().min(1).max(200),
});

export const onGenerationInputSchema = z.object({ generationId: z.string() });
