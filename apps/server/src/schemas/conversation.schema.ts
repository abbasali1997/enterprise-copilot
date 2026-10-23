import { z } from "zod";
import { GEMINI_MODELS, OPENAI_MODELS } from "@enterprise/llm";

export const sendMessageInputSchema = z
  .object({
    conversationId: z.string().trim().uuid().optional(),
    assistantId: z.string().trim().uuid().optional(),
    content: z.string().trim().min(1),
    provider: z.enum(["openai", "gemini"]),
    model: z.enum([...OPENAI_MODELS, ...GEMINI_MODELS].map(({ model }) => model)),
  })
  .refine(
    ({ provider, model }) =>
      [...OPENAI_MODELS, ...GEMINI_MODELS].some(
        (entry) =>
          entry.provider === provider && entry.model === model && entry.enabled,
      ),
    { message: "Model must be enabled and belong to the selected provider", path: ["model"] },
  );

export const getConversationInputSchema = z.object({
  conversationId: z.string().trim().uuid(),
});

export const renameConversationInputSchema = getConversationInputSchema.extend({
  title: z.string().trim().min(1).max(200),
});

export const onGenerationInputSchema = z.object({ generationId: z.string() });
