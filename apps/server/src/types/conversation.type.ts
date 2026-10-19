import { z } from "zod";
import {
  renameConversationInputSchema,
  sendMessageInputSchema,
} from "../schemas/conversation.schema.js";

export type SendMessageInputType = z.infer<typeof sendMessageInputSchema>;

export type RenameConversationInputType = z.infer<
  typeof renameConversationInputSchema
>;
