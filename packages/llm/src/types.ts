export type LLMProviderName = "openai" | "gemini";

export type LLMRole = "system" | "user" | "assistant";

export type LLMMessage = {
  role: LLMRole;
  content: string;
};

export type LLMUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
};

export type LLMFinishReason =
  | "stop"
  | "length"
  | "content_filter"
  | "tool_call"
  | "cancelled"
  | "error"
  | "unknown";

export type LLMGenerateInput = {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  /**
   * Useful when user clicks "Stop generating".
   */
  signal?: AbortSignal;
  /**
   * Server may provide this so it can correlate
   * database records / SSE events / logs.
   */
  generationId?: string;
};

export type LLMGenerateResult = {
  generationId: string;
  provider: LLMProviderName;
  providerResponseId?: string;
  model: string;
  text: string;
  usage: LLMUsage;
  finishReason: LLMFinishReason;
  latencyMs: number;
};

export type LLMStreamEvent =
  | {
      /** Generation has started; identifies the provider and model. */
      type: "start";
      generationId: string;
      provider: LLMProviderName;
      model: string;
      providerResponseId?: string;
    }
  | {
      /** A new text fragment to append to the generated response. */
      type: "text-delta";
      generationId: string;
      delta: string;
    }
  | {
      /** Token usage reported for this generation. */
      type: "usage";
      generationId: string;
      usage: LLMUsage;
    }
  | {
      /** Generation has ended; includes the finish reason and elapsed time. */
      type: "finish";
      generationId: string;
      providerResponseId?: string;
      model: string;
      finishReason: LLMFinishReason;
      latencyMs: number;
    };
