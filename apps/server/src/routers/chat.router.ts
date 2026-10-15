import { tenantProcedure, router } from "../trpc.js";
import { sendMessageInputSchema } from "../schemas/chat.schema.js";
import { sendMessage } from "../services/chat.service.js";

export const chatRouter = router({
  sendMessage: tenantProcedure
    .input(sendMessageInputSchema)
    .mutation(({ input, ctx }) =>
      sendMessage(input, ctx.user.id, ctx.organizationId),
    ),
});
