import { can, PERMISSIONS, type OrganizationRole } from "@enterprise/auth";
import { GEMINI_MODELS, OPENAI_MODELS } from "@enterprise/llm";
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
  failLlmRequest,
} from "../repositories/llm-request.repository.js";
import { TRPCError } from "@trpc/server";
import { Prisma, prisma } from "@enterprise/db";
import { randomUUID } from "node:crypto";

import { logger } from "../utils/logger.js";
import { llmInteractiveQueue } from "@enterprise/worker/queues/llm-interactive";
import {
  generationStreamKey,
  type GenerationEvent,
} from "@enterprise/worker/generation-events";
import { REDIS_CONNECTION } from "@enterprise/worker/redis";

const requirePermissions = (
  role: OrganizationRole,
  ...permissions: PERMISSIONS[]
) => {
  if (permissions.some((permission) => !can(role, permission))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action",
    });
  }
};

export const getAvailableModels = (role: OrganizationRole) => {
  if (!can(role, PERMISSIONS.MODEL_VIEW)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to view models",
    });
  }

  return [...OPENAI_MODELS, ...GEMINI_MODELS].filter((model) => model.enabled);
};

export const getConversationList = async (
  signedInUserId: string,
  organizationId: string,
  role: OrganizationRole,
) => {
  if (!can(role, PERMISSIONS.CONVERSATION_READ_OWN)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to read conversations",
    });
  }

  return prisma.conversation.findMany({
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
};

export const sendMessage = async (
  input: SendMessageInputType,
  signedInUserId: string,
  organizationId: string,
  role: OrganizationRole,
) => {
  requirePermissions(role, PERMISSIONS.CHAT_USE, PERMISSIONS.MODEL_USE);
  requirePermissions(
    role,
    input.conversationId
      ? PERMISSIONS.CONVERSATION_READ_OWN
      : PERMISSIONS.CONVERSATION_CREATE,
  );

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

  try {
    await llmInteractiveQueue.add(
      "generate-chat",
      {
        generationId,
        conversationId: conversation.id,
        userId: signedInUserId,
        organizationId,
        provider: input.provider,
        model: input.model,
        content: input.content,
      },
      { jobId: generationId },
    );
  } catch (error) {
    await failLlmRequest({
      id: generationId,
      code: "QUEUE_UNAVAILABLE",
      message: "Could not enqueue response generation",
    });

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not start response generation",
      cause: error,
    });
  }

  logger.info(
    JSON.stringify({ generationId, conversationId: conversation.id }),
    "Generation queued",
  );

  return { message, generationId };
};

export type { GenerationEvent } from "@enterprise/worker/generation-events";

export async function* onGeneration(
  generationId: string,
  userId: string,
  organizationId: string,
  role: OrganizationRole,
  lastEventId?: string | null,
  signal?: AbortSignal,
) {
  if (!can(role, PERMISSIONS.CHAT_USE)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to use the chat",
    });
  }

  if (!can(role, PERMISSIONS.CONVERSATION_READ_OWN)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to read a conversation",
    });
  }

  const request = await prisma.llmRequest.findUnique({
    where: { id: generationId },
  });
  const conversation = request?.conversationId
    ? await findUserConversation(request.conversationId, userId, organizationId)
    : null;
  if (!request || !conversation) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
  }
  if (lastEventId && !/^\d+-\d+$/.test(lastEventId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid event cursor",
    });
  }
  let cursor = lastEventId ?? "0-0";
  // Blocking reads need their own connection so one subscriber cannot block others.
  const reader = REDIS_CONNECTION.duplicate({
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });
  reader.on("error", () => {});
  const abort = () => reader.disconnect();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    while (!signal?.aborted) {
      const streams = await reader.xread(
        "COUNT",
        100,
        "BLOCK",
        1000,
        "STREAMS",
        generationStreamKey(generationId),
        cursor,
      );
      if (streams) {
        for (const [, entries] of streams) {
          for (const [id, fields] of entries) {
            const event = JSON.parse(fields[1]!) as GenerationEvent;
            cursor = id;
            yield { id, event };
            if (event.type === "finish" || event.type === "error") return;
          }
        }
      } else {
        // Recover a terminal event if the worker died after committing to the DB,
        // or if the Redis replay buffer has expired.
        const latest = await prisma.llmRequest.findUnique({
          where: { id: generationId },
        });
        if (latest?.status === "COMPLETED") {
          // Recheck the stream: completion may have raced the previous read.
          const pending = await reader.xrange(
            generationStreamKey(generationId),
            `(${cursor}`,
            "+",
            "COUNT",
            1,
          );
          if (pending.length) continue;
          if (!(await reader.exists(generationStreamKey(generationId)))) {
            yield {
              id: cursor,
              event: {
                type: "error" as const,
                generationId,
                message:
                  "Response stream expired. Reload the conversation to view the saved response.",
              },
            };
            return;
          }
          yield {
            id: cursor,
            event: {
              type: "finish" as const,
              generationId,
              model: latest.model,
              providerResponseId: latest.providerResponseId ?? undefined,
              finishReason: (latest.finishReason ?? "unknown") as Extract<
                GenerationEvent,
                { type: "finish" }
              >["finishReason"],
              latencyMs: latest.latencyMs ?? 0,
            },
          };
          return;
        }
        if (
          !latest ||
          latest.status === "FAILED" ||
          latest.status === "CANCELLED"
        ) {
          yield {
            id: cursor,
            event: {
              type: "error" as const,
              generationId,
              message: "Response generation failed",
            },
          };
          return;
        }
      }
    }
  } catch (error) {
    if (!signal?.aborted) throw error;
  } finally {
    signal?.removeEventListener("abort", abort);
    reader.disconnect();
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
  role: OrganizationRole,
) => {
  if (!can(role, PERMISSIONS.CONVERSATION_READ_OWN)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to read a conversation",
    });
  }

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
  role: OrganizationRole,
) => {
  if (!can(role, PERMISSIONS.CONVERSATION_UPDATE_OWN)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to update a conversation",
    });
  }

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
