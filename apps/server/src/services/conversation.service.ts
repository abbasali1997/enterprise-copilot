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
import {
  createLlmRequest,
  completeLlmRequest,
  failLlmRequest,
} from "../repositories/llm-request.repository.js";
import { TRPCError } from "@trpc/server";
import { Prisma, prisma } from "@enterprise/db";
import { llmGateway } from "../lib/llm.js";
import { randomUUID } from "node:crypto";
import { LLMProviderError, type LLMGenerateResult } from "@enterprise/llm";

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

  const message = await createMessage({
    conversationId: conversation.id,
    userId: signedInUserId,
    role: "USER",
    content: input.content,
  });

  const result: LLMGenerateResult = {
    generationId: "",
    provider: input.provider,
    model: input.model,
    text: "",
    usage: {},
    finishReason: "unknown",
    latencyMs: 0,
  };

  for await (const event of generateChatResponse({
    provider: input.provider,
    model: input.model,
    conversationId: conversation.id,
    messages: [
      { role: "system", content: "You are a helpful enterprise assistant." },
      { role: "user", content: input.content },
    ],
  })) {
    result.generationId = event.generationId;

    switch (event.type) {
      case "start":
        result.provider = event.provider;
        result.model = event.model;
        result.providerResponseId = event.providerResponseId;
        break;
      case "text-delta":
        result.text += event.delta;
        break;
      case "usage":
        result.usage = event.usage;
        break;
      case "finish":
        result.providerResponseId = event.providerResponseId;
        result.model = event.model;
        result.finishReason = event.finishReason;
        result.latencyMs = event.latencyMs;
        break;
    }
  }

  await createMessage({
    id: result.generationId,
    conversationId: conversation.id,
    role: "ASSISTANT",
    status: "COMPLETED",
    content: result.text,
    model: result.model,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    latencyMs: result.latencyMs,
    metadata: {
      provider: result.provider,
      providerResponseId: result.providerResponseId ?? null,
      finishReason: result.finishReason,
    },
  });

  return {
    message,
    generationId: result.generationId,
    metadata: result,
  };
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

export async function* generateChatResponse(input: {
  provider: SendMessageInputType["provider"];
  model: SendMessageInputType["model"];
  conversationId: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
}) {
  const generationId = randomUUID();
  const provider = input.provider;
  const model = input.model;

  await createLlmRequest({
    id: generationId,
    conversationId: input.conversationId,
    provider,
    model,
  });

  let usage:
    | {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
      }
    | undefined;

  try {
    for await (const event of llmGateway.stream({
      generationId,
      provider,
      model,
      messages: input.messages,
    })) {
      if (event.type === "usage") {
        usage = event.usage;
      }

      if (event.type === "finish") {
        await completeLlmRequest({
          id: generationId,
          providerResponseId: event.providerResponseId,
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
          totalTokens: usage?.totalTokens,
          latencyMs: event.latencyMs,
          finishReason: event.finishReason,
        });
      }

      /*
       * Server/tRPC only receives
       * normalized events.
       */
      yield event;
    }
  } catch (error) {
    if (error instanceof LLMProviderError) {
      await failLlmRequest({
        id: generationId,
        code: error.code,
        message: error.message,
      });
    }

    throw error;
  }
}
