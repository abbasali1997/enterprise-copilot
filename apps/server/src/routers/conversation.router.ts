import { tracked } from "@trpc/server";
import { tenantProcedure, router } from "../trpc.js";
import {
  getConversationInputSchema,
  onGenerationInputSchema,
  renameConversationInputSchema,
  sendMessageInputSchema,
} from "../schemas/conversation.schema.js";
import {
  onGeneration,
  getConversationList,
  getConversation,
  renameConversation,
  sendMessage,
} from "../services/conversation.service.js";

export const conversationRouter = router({
  get: tenantProcedure
    .input(getConversationInputSchema)
    .query(({ input, ctx }) =>
      getConversation(
        input.conversationId,
        ctx.user.id,
        ctx.organizationId,
        ctx.role,
      ),
    ),

  rename: tenantProcedure
    .input(renameConversationInputSchema)
    .mutation(({ input, ctx }) =>
      renameConversation(input, ctx.user.id, ctx.organizationId, ctx.role),
    ),

  sendMessage: tenantProcedure
    .input(sendMessageInputSchema)
    .mutation(({ input, ctx }) =>
      sendMessage(input, ctx.user.id, ctx.organizationId, ctx.role),
    ),

  list: tenantProcedure.query(({ ctx }) =>
    getConversationList(ctx.user.id, ctx.organizationId, ctx.role),
  ),

  onGeneration: tenantProcedure
    .input(onGenerationInputSchema)
    .subscription(async function* ({ ctx, input, signal }) {
      for await (const { id, event } of onGeneration(
        input.generationId,
        ctx.user.id,
        ctx.organizationId,
        ctx.role,
        input.lastEventId,
        signal,
      ))
        yield tracked(id, event);
    }),
});
