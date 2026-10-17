import { tenantProcedure, router } from "../trpc.js";
import { sendMessageInputSchema } from "../schemas/conversation.schema.js";
import { sendMessage } from "../services/conversation.service.js";

export const conversationRouter = router({
  sendMessage: tenantProcedure
    .input(sendMessageInputSchema)
    .mutation(({ input, ctx }) =>
      sendMessage(input, ctx.user.id, ctx.organizationId),
    ),
});
