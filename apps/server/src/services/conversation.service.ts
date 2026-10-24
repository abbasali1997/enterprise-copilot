import type {
  RenameConversationInputType,
  SendMessageInputType,
} from "../types/conversation.type.js";
import {
  createConversation,
  createMessage,
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
import {
  LLMProviderError,
  type LLMStreamEvent,
  type LLMGenerateResult,
} from "@enterprise/llm";

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
    conversation = await findUserConversation(
      input.conversationId,
      signedInUserId,
      organizationId,
    );
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
  const generationId = randomUUID();
  await createLlmRequest({
    id: generationId,
    conversationId: conversation.id,
    provider: input.provider,
    model: input.model,
  });
  const state: GenerationState = {
    userId: signedInUserId,
    organizationId,
    events: [],
    listeners: new Set(),
    done: false,
  };
  generations.set(generationId, state);
  void runGeneration(input, conversation.id, generationId, state);
  return { message, generationId };
};

export type GenerationEvent =
  | LLMStreamEvent
  | {
      type: "error";
      generationId: string;
      message: string;
    };

type GenerationState = {
  userId: string;
  organizationId: string;
  events: GenerationEvent[];
  listeners: Set<() => void>;
  done: boolean;
};

const generations = new Map<string, GenerationState>();

export async function* onGeneration(
  generationId: string,
  userId: string,
  organizationId: string,
  lastEventId?: string | null,
  signal?: AbortSignal,
) {
  const state = generations.get(generationId);
  if (
    !state ||
    state.userId !== userId ||
    state.organizationId !== organizationId
  )
    throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
  let cursor = lastEventId ? Number(lastEventId) : 0;
  if (
    !Number.isSafeInteger(cursor) ||
    cursor < 0 ||
    cursor > state.events.length
  )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid event cursor",
    });
  while (!signal?.aborted) {
    while (cursor < state.events.length)
      yield { id: String(cursor + 1), event: state.events[cursor++]! };
    if (state.done) return;
    await new Promise<void>((resolve) => {
      const wake = () => {
        state.listeners.delete(wake);
        signal?.removeEventListener("abort", wake);
        resolve();
      };
      state.listeners.add(wake);
      signal?.addEventListener("abort", wake, { once: true });
      if (signal?.aborted || state.done || cursor < state.events.length) wake();
    });
  }
}

async function runGeneration(
  input: SendMessageInputType,
  conversationId: string,
  generationId: string,
  state: GenerationState,
) {
  const publish = (event: GenerationEvent) => {
    state.events.push(event);
    for (const wake of state.listeners) wake();
  };
  try {
    const result: LLMGenerateResult = {
      generationId,
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
      conversationId,
      generationId,
      messages: [
        { role: "system", content: "You are a helpful enterprise assistant." },
        { role: "user", content: input.content },
      ],
    })) {
      if (event.type !== "finish") publish(event);
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
      conversationId,
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
    publish({
      type: "finish",
      generationId,
      model: result.model,
      providerResponseId: result.providerResponseId,
      finishReason: result.finishReason,
      latencyMs: result.latencyMs,
    });
  } catch (error) {
    publish({
      type: "error",
      generationId,
      message: "Response generation failed",
    });
    try {
      await failLlmRequest({
        id: generationId,
        code:
          error instanceof LLMProviderError
            ? error.code
            : "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Generation failed",
      });
    } catch (persistenceError) {
      console.error("Failed to record generation failure", persistenceError);
    }
  } finally {
    state.done = true;
    for (const wake of state.listeners) wake();
    setTimeout(() => generations.delete(generationId), 300000).unref();
  }
}

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
  generationId: string;
  provider: SendMessageInputType["provider"];
  model: SendMessageInputType["model"];
  conversationId: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
}) {
  const generationId = input.generationId;
  const provider = input.provider;
  const model = input.model;
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
