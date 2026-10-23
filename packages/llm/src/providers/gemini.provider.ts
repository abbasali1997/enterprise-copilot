import { GoogleGenAI } from "@google/genai";
import type { LLMFinishReason, LLMMessage, LLMUsage } from "../types.js";
import type { LLMProvider, LLMProviderInput } from "../provider.js";
import { LLMProviderError } from "../errors.js";

export const GEMINI_MODELS = [
  {
    provider: "gemini",
    model: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    tier: "ENTRY",
    enabled: true,
  },
  {
    provider: "gemini",
    model: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    tier: "STANDARD",
    enabled: true,
  },

  // Older Gemini models — useful if your account has access
  {
    provider: "gemini",
    model: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    tier: "ENTRY",
    enabled: false,
  },
  {
    provider: "gemini",
    model: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    tier: "ENTRY",
    enabled: false,
  },
] as const;

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini" as const;

  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({
      apiKey,
    });
  }

  async generate(input: LLMProviderInput) {
    const startedAt = performance.now();

    try {
      const response = await this.client.models.generateContent({
        model: input.model,
        contents: getConversationContents(input.messages),
        config: {
          systemInstruction: getSystemInstruction(input.messages),
          temperature: input.temperature,
          maxOutputTokens: input.maxOutputTokens,
        },
      });

      return {
        generationId: input.generationId,
        provider: this.name,
        providerResponseId: undefined,
        model: input.model,
        text: response.text ?? "",
        usage: normalizeGeminiUsage(response.usageMetadata),
        finishReason: normalizeGeminiFinishReason(
          response.candidates?.[0]?.finishReason,
        ),
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      throw normalizeGeminiError(error);
    }
  }

  // @ts-ignore
  async *stream(input: LLMProviderInput) {
    const startedAt = performance.now();

    try {
      const stream = await this.client.models.generateContentStream({
        model: input.model,
        contents: getConversationContents(input.messages),
        config: {
          systemInstruction: getSystemInstruction(input.messages),
          temperature: input.temperature,
          maxOutputTokens: input.maxOutputTokens,
        },
      });

      yield {
        type: "start",
        generationId: input.generationId,
        provider: this.name,
        model: input.model,
        providerResponseId: undefined,
      };

      let finalChunk: any;

      for await (const chunk of stream) {
        finalChunk = chunk;

        const delta = chunk.text;

        if (delta) {
          yield {
            type: "text-delta",
            generationId: input.generationId,
            delta,
          };
        }
      }

      yield {
        type: "usage",
        generationId: input.generationId,
        usage: normalizeGeminiUsage(finalChunk?.usageMetadata),
      };

      yield {
        type: "finish",
        generationId: input.generationId,
        model: input.model,
        providerResponseId: undefined,
        finishReason: normalizeGeminiFinishReason(
          finalChunk?.candidates?.[0]?.finishReason,
        ),
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      throw normalizeGeminiError(error);
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

function getConversationContents(messages: LLMMessage[]) {
  return messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: message.content,
        },
      ],
    }));
}

function normalizeGeminiUsage(
  usage:
    | {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      }
    | null
    | undefined,
): LLMUsage {
  return {
    inputTokens: usage?.promptTokenCount,
    outputTokens: usage?.candidatesTokenCount,
    totalTokens: usage?.totalTokenCount,
  };
}

function normalizeGeminiFinishReason(reason?: string): LLMFinishReason {
  switch (reason) {
    case "STOP":
      return "stop";

    case "MAX_TOKENS":
      return "length";

    case "SAFETY":
      return "content_filter";

    default:
      return "unknown";
  }
}

function normalizeGeminiError(error: unknown): LLMProviderError {
  if (error instanceof Error && error.name === "AbortError") {
    return new LLMProviderError({
      provider: "gemini",
      code: "CANCELLED",
      message: "Generation was cancelled",
      retryable: false,
      cause: error,
    });
  }

  const details = getGeminiErrorDetails(error);
  const status = details.status;

  if (status === 401 || status === 403) {
    return new LLMProviderError({
      provider: "gemini",
      code: "AUTHENTICATION",
      message: details.message ?? "LLM provider authentication failed",
      status,
      retryable: false,
      cause: error,
    });
  }

  if (status === 429) {
    return new LLMProviderError({
      provider: "gemini",
      code: "RATE_LIMIT",
      message: details.message ?? "LLM provider rate limit exceeded",
      status,
      retryable: true,
      cause: error,
    });
  }

  if (status === 400) {
    return new LLMProviderError({
      provider: "gemini",
      code: "BAD_REQUEST",
      message: details.message ?? "Unknown LLM provider error",
      status,
      retryable: false,
      cause: error,
    });
  }

  if (status && status >= 500) {
    return new LLMProviderError({
      provider: "gemini",
      code: "UNAVAILABLE",
      message: details.message ?? "LLM provider is unavailable",
      status,
      retryable: true,
      cause: error,
    });
  }

  return new LLMProviderError({
    provider: "gemini",
    code: "UNKNOWN",
    message: details.message ?? "Unknown LLM provider error",
    retryable: false,
    cause: error,
  });
}

function getGeminiErrorDetails(
  error: unknown,
  depth = 0,
): { message?: string; status?: number } {
  if (depth >= 8) return {};

  if (typeof error === "string") {
    try {
      const parsed: unknown = JSON.parse(error);
      if (typeof parsed === "object" && parsed !== null) {
        return getGeminiErrorDetails(parsed, depth + 1);
      }
    } catch {
      // SDK messages can contain either JSON payloads or plain text.
    }
    return error.trim() ? { message: error } : {};
  }

  if (typeof error !== "object" || error === null) return {};

  const nested =
    "error" in error ? getGeminiErrorDetails(error.error, depth + 1) : {};
  const message =
    "message" in error ? getGeminiErrorDetails(error.message, depth + 1) : {};
  const status =
    "status" in error && typeof error.status === "number"
      ? error.status
      : "code" in error && typeof error.code === "number"
        ? error.code
        : undefined;

  return {
    message: nested.message ?? message.message,
    status: status ?? nested.status ?? message.status,
  };
}
