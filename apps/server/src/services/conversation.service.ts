import type { SendMessageInputType } from "../types/conversation.type.js";
import {
  createConversation,
  createMessage,
  findConversationById,
} from "../repositories/conversation.repository.js";
import { TRPCError } from "@trpc/server";

export const sendMessage = async (
  input: SendMessageInputType,
  signedInUserId: string,
  organizationId: string,
) => {
  // If conversationId not provided then create a new conversation first
  let conversation;
  if (!input.conversationId) {
    const title = createFallbackTitle(input.content);

    conversation = await createConversation({
      title,
      organizationId,
      userId: signedInUserId,
    });
  } else {
    conversation = await findConversationById(input.conversationId);

    if (!conversation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Could not find conversation with id ${input.conversationId}`,
      });
    }
  }

  return createMessage({
    conversationId: conversation.id,
    userId: signedInUserId,
    role: "USER",
    content: input.content,
  });
};

const createFallbackTitle = (message: string) => {
  const trimmed = message.trim();

  if (trimmed.length <= 50) {
    return trimmed;
  }

  return `${trimmed.slice(0, 47)}...`;
};
