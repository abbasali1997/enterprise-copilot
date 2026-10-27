import { type Job, UnrecoverableError } from "bullmq";
import { prisma } from "@enterprise/db";
import {
  LLMProviderError,
  type LLMStreamEvent,
  type LLMUsage,
} from "@enterprise/llm";
import { QUEUE_NAMES } from "../queue.constants.js";
import { REDIS_CONNECTION } from "../redis.js";
import {
  GENERATION_TTL_SECONDS,
  publishGenerationEvent,
  type ChatGenerationJob,
} from "../generation-events.js";
import { processJob } from "../process-job.js";
import { createWorker } from "./create-worker.js";
import { logger } from "../utils/logger.js";
import { llmGateway } from "../lib/llm.js";

const failGeneration = async (generationId: string, error: Error) => {
  const updated = await prisma.llmRequest.updateMany({
    where: { id: generationId, status: "RUNNING" },
    data: {
      status: "FAILED",
      errorCode:
        error instanceof LLMProviderError
          ? error.code
          : "INTERNAL_SERVER_ERROR",
      errorMessage: error.message,
      completedAt: new Date(),
    },
  });

  if (!updated.count) return;

  await publishGenerationEvent({
    type: "error",
    generationId,
    message: "Response generation failed",
  });
};

export const processLlmInteractiveJob = async (job: Job<ChatGenerationJob>) => {
  if (job.name !== "generate-chat") return processJob(job);

  const {
    generationId,
    conversationId,
    userId,
    organizationId,
    provider,
    model,
    content,
  } = job.data;

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId, organizationId, status: "ACTIVE" },
    });

    if (!conversation) throw new Error("Conversation not found");

    const request = await prisma.llmRequest.findUnique({
      where: { id: generationId },
    });

    if (!request || request.conversationId !== conversationId)
      throw new Error("Generation not found");

    if (request.status === "COMPLETED") return;

    if (request.status !== "RUNNING")
      throw new Error("Generation is no longer running");

    // Do not restart a partially streamed generation after a stalled-job recovery.
    const claimed = await REDIS_CONNECTION.set(
      `generation:${generationId}:started`,
      "1",
      "EX",
      GENERATION_TTL_SECONDS,
      "NX",
    );
    if (!claimed)
      throw new Error(
        "Generation was already started; refusing to replay partial output",
      );

    const gateway = llmGateway;
    let text = "";
    let usage: LLMUsage = {};
    let finish: Extract<LLMStreamEvent, { type: "finish" }> | undefined;

    logger.info(
      `Generation ${generationId} started`,
      QUEUE_NAMES.llmInteractive,
    );

    for await (const event of gateway.stream({
      generationId,
      provider,
      model,
      signal: AbortSignal.timeout(10 * 60 * 1000),
      messages: [
        { role: "system", content: "You are a helpful enterprise assistant." },
        { role: "user", content },
      ],
    })) {
      if (event.type === "finish") {
        finish = event;
        continue;
      }
      if (event.type === "text-delta") text += event.delta;
      if (event.type === "usage") usage = event.usage;

      await publishGenerationEvent(event);
    }

    if (!finish)
      throw new Error("Provider stream ended without a finish event");

    // Persist the response and usage together before telling the client it finished.
    await prisma.$transaction(async (db) => {
      await db.message.upsert({
        where: { id: generationId },
        update: {},
        create: {
          id: generationId,
          conversationId,
          role: "ASSISTANT",
          status: "COMPLETED",
          content: text,
          model: finish.model,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          latencyMs: finish.latencyMs,
          metadata: {
            provider,
            providerResponseId: finish.providerResponseId ?? null,
            finishReason: finish.finishReason,
          },
        },
      });

      await db.llmRequest.update({
        where: { id: generationId },
        data: {
          status: "COMPLETED",
          providerResponseId: finish.providerResponseId,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
          latencyMs: finish.latencyMs,
          finishReason: finish.finishReason,
          completedAt: new Date(),
        },
      });
    });

    await publishGenerationEvent(finish);

    logger.info(
      `Generation ${generationId} completed`,
      QUEUE_NAMES.llmInteractive,
    );
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    await failGeneration(generationId, failure);
    throw new UnrecoverableError(failure.message);
  }
};

export const llmInteractiveWorker = createWorker(
  QUEUE_NAMES.llmInteractive,
  processLlmInteractiveJob,
);

// Includes jobs that BullMQ fails after exceeding the stalled-job limit.
llmInteractiveWorker.on("failed", (job, error) => {
  if (job?.name !== "generate-chat") return;
  void failGeneration(job.data.generationId, error).catch(
    (failure: unknown) => {
      logger.error(`Failed to record generation failure: ${String(failure)}`);
    },
  );
});
