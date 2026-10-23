import { GEMINI_MODELS, OPENAI_MODELS } from "@enterprise/llm";
import { tenantProcedure, router } from "../trpc.js";
import {
  getConversationInputSchema,
  onGenerationInputSchema,
  renameConversationInputSchema,
  sendMessageInputSchema,
} from "../schemas/conversation.schema.js";
import {
  getConversationList,
  getConversation,
  renameConversation,
  sendMessage,
} from "../services/conversation.service.js";

export const conversationRouter = router({
  models: tenantProcedure.query(() =>
    [...OPENAI_MODELS, ...GEMINI_MODELS].filter((model) => model.enabled),
  ),

  get: tenantProcedure
    .input(getConversationInputSchema)
    .query(({ input, ctx }) =>
      getConversation(input.conversationId, ctx.user.id, ctx.organizationId),
    ),

  rename: tenantProcedure
    .input(renameConversationInputSchema)
    .mutation(({ input, ctx }) =>
      renameConversation(input, ctx.user.id, ctx.organizationId),
    ),

  sendMessage: tenantProcedure
    .input(sendMessageInputSchema)
    .mutation(({ input, ctx }) =>
      sendMessage(input, ctx.user.id, ctx.organizationId),
    ),

  list: tenantProcedure.query(({ ctx }) =>
    getConversationList(ctx.user.id, ctx.user.organizationId),
  ),

  onGeneration: tenantProcedure
    .input(onGenerationInputSchema)
    .subscription(async function* ({ ctx, input }) {
      // yield typed generation events
    }),
});
