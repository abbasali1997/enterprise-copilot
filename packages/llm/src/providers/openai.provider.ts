import OpenAI from "openai";
import type { LLMFinishReason, LLMMessage, LLMUsage } from "../types.js";
import type { LLMProvider, LLMProviderInput } from "../provider.js";
import { LLMProviderError } from "../errors.js";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai" as const;

  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
    });
  }

  async generate(input: LLMProviderInput) {
    const startedAt = performance.now();

    try {
      const response = await this.client.responses.create(
        {
          model: input.model,
          instructions: getSystemInstruction(input.messages),
          input: getConversationMessages(input.messages),
          temperature: input.temperature,
          max_output_tokens: input.maxOutputTokens,
        },
        {
          signal: input.signal,
        },
      );

      return {
        generationId: input.generationId,
        provider: this.name,
        providerResponseId: response.id,
        model: response.model,
        text: response.output_text,
        usage: normalizeOpenAIUsage(response.usage),
        finishReason: normalizeOpenAIFinishReason(response),
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      throw normalizeOpenAIError(error);
    }
  }

  // @ts-ignore
  async *stream(input: LLMProviderInput) {
    const startedAt = performance.now();

    let providerResponseId: string | undefined;

    try {
      const stream = await this.client.responses.create(
        {
          model: input.model,
          instructions: getSystemInstruction(input.messages),
          input: getConversationMessages(input.messages),
          temperature: input.temperature,
          max_output_tokens: input.maxOutputTokens,
          stream: true,
        },
        {
          signal: input.signal,
        },
      );

      for await (const event of stream) {
        switch (event.type) {
          case "response.created": {
            providerResponseId = event.response.id;

            yield {
              type: "start",
              generationId: input.generationId,
              provider: this.name,
              model: event.response.model,
              providerResponseId,
            };

            break;
          }

          case "response.output_text.delta": {
            if (!event.delta) {
              break;
            }

            yield {
              type: "text-delta",
              generationId: input.generationId,
              delta: event.delta,
            };

            break;
          }

          case "response.completed": {
            const response = event.response;

            yield {
              type: "usage",
              generationId: input.generationId,
              usage: normalizeOpenAIUsage(response.usage),
            };

            yield {
              type: "finish",
              generationId: input.generationId,
              model: response.model,
              providerResponseId: response.id,
              finishReason: "stop",
              latencyMs: Math.round(performance.now() - startedAt),
            };

            return;
          }

          case "response.incomplete": {
            const response = event.response;

            yield {
              type: "usage",
              generationId: input.generationId,
              usage: normalizeOpenAIUsage(response.usage),
            };

            yield {
              type: "finish",
              generationId: input.generationId,
              model: response.model,
              providerResponseId: response.id,
              finishReason: normalizeOpenAIFinishReason(response),
              latencyMs: Math.round(performance.now() - startedAt),
            };

            return;
          }

          case "response.failed": {
            throw new Error(
              event.response.error?.message ?? "OpenAI generation failed",
            );
          }
        }
      }
    } catch (error) {
      throw normalizeOpenAIError(error);
    }
  }
}

function getSystemInstruction(messages: LLMMessage[]) {
  const instructions = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");

  return instructions || undefined;
}

function getConversationMessages(messages: LLMMessage[]) {
  return messages
    .filter(
      (
        message,
      ): message is LLMMessage & {
        role: "user" | "assistant";
      } => message.role !== "system",
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function normalizeOpenAIUsage(
  usage:
    | {
        input_tokens?: number;
        output_tokens?: number;
        total_tokens?: number;
      }
    | null
    | undefined,
): LLMUsage {
  return {
    inputTokens: usage?.input_tokens,
    outputTokens: usage?.output_tokens,
    totalTokens: usage?.total_tokens,
  };
}

function normalizeOpenAIFinishReason(response: {
  status?: string;
  incomplete_details?: {
    reason?: string;
  } | null;
}): LLMFinishReason {
  if (response.status === "completed") {
    return "stop";
  }

  const reason = response.incomplete_details?.reason;

  if (reason === "max_output_tokens") {
    return "length";
  }

  if (reason === "content_filter") {
    return "content_filter";
  }

  return "unknown";
}

function normalizeOpenAIError(error: unknown): LLMProviderError {
  if (error instanceof Error && error.name === "AbortError") {
    return new LLMProviderError({
      provider: "openai",
      code: "CANCELLED",
      message: "Generation was cancelled",
      retryable: false,
      cause: error,
    });
  }

  const status = getHttpStatus(error);

  if (status === 401 || status === 403) {
    return new LLMProviderError({
      provider: "openai",
      code: "AUTHENTICATION",
      message: "LLM provider authentication failed",
      status,
      retryable: false,
      cause: error,
    });
  }

  if (status === 429) {
    return new LLMProviderError({
      provider: "openai",
      code: "RATE_LIMIT",
      message: "LLM provider rate limit exceeded",
      status,
      retryable: true,
      cause: error,
    });
  }

  if (status === 400) {
    return new LLMProviderError({
      provider: "openai",
      code: "BAD_REQUEST",
      message: getErrorMessage(error),
      status,
      retryable: false,
      cause: error,
    });
  }

  if (status && status >= 500) {
    return new LLMProviderError({
      provider: "openai",
      code: "UNAVAILABLE",
      message: "LLM provider is unavailable",
      status,
      retryable: true,
      cause: error,
    });
  }

  return new LLMProviderError({
    provider: "openai",
    code: "UNKNOWN",
    message: getErrorMessage(error),
    retryable: false,
    cause: error,
  });
}

function getHttpStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return undefined;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown LLM provider error";
}
