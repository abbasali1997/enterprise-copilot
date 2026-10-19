import type {
  RenameConversationInputType,
  SendMessageInputType,
} from "../types/conversation.type.js";
import {
  createConversation,
  createMessage,
  findConversationById,
  findUserConversation,
  renameUserConversation,
} from "../repositories/conversation.repository.js";
import { TRPCError } from "@trpc/server";
import { Prisma, prisma } from "@enterprise/db";

export const getConversationList = async (
  signedInUserId: string,
  organizationId: string,
) =>
  prisma.conversation.findMany({
    where: {
      organizationId,
      userId: signedInUserId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      title: true,
      lastMessageAt: true,
    },
    orderBy: {
      lastMessageAt: {
        sort: "asc",
      },
    },
  });

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

export const getConversation = async (
  conversationId: string,
  signedInUserId: string,
  organizationId: string,
) => {
  const conversation = await findUserConversation(
    conversationId,
    signedInUserId,
    organizationId,
  );
  if (!conversation) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Conversation not found",
    });
  }
  return conversation;
};

export const renameConversation = async (
  input: RenameConversationInputType,
  signedInUserId: string,
  organizationId: string,
) => {
  try {
    return await renameUserConversation(
      input.conversationId,
      input.title,
      signedInUserId,
      organizationId,
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      });
    }
    throw error;
  }
};
