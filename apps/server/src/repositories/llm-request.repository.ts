import { type DbClient, prisma } from "@enterprise/db";

export const createLlmRequest = (
  input: {
    id: string;
    conversationId: string;
    provider: string;
    model: string;
  },
  db: DbClient = prisma,
) => {
  return db.llmRequest.create({
    data: {
      ...input,
      status: "RUNNING",
    },
  });
};

export const completeLlmRequest = (
  input: {
    id: string;
    providerResponseId?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    latencyMs: number;
    finishReason: string;
  },
  db: DbClient = prisma,
) => {
  return db.llmRequest.update({
    where: {
      id: input.id,
    },

    data: {
      status: "COMPLETED",
      providerResponseId: input.providerResponseId,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      totalTokens: input.totalTokens,
      latencyMs: input.latencyMs,
      finishReason: input.finishReason,
      completedAt: new Date(),
    },
  });
};

export const failLlmRequest = (
  input: {
    id: string;
    code: string;
    message: string;
  },
  db: DbClient = prisma,
) => {
  return db.llmRequest.update({
    where: {
      id: input.id,
    },

    data: {
      status: "FAILED",
      errorCode: input.code,
      errorMessage: input.message,
      completedAt: new Date(),
    },
  });
};
