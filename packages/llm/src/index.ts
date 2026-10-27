export { LLMGateway, EmbeddingGateway } from "./gateway.js";
export type { LLMGatewayRequest, EmbeddingGatewayRequest } from "./gateway.js";

export { OpenAIProvider, OPENAI_MODELS } from "./providers/openai.provider.js";
export { GeminiProvider, GEMINI_MODELS } from "./providers/gemini.provider.js";

export { LLMProviderError } from "./errors.js";

export type {
  LLMProvider,
  EmbeddingProvider,
  EmbeddingOptions,
} from "./provider.js";

export type {
  LLMMessage,
  LLMUsage,
  LLMFinishReason,
  LLMStreamEvent,
  LLMGenerateInput,
  LLMGenerateResult,
  LLMProviderName,
} from "./types.js";

export { GeminiEmbeddingProvider } from "./embeddings/gemini-embedding.provider.ts";
export type { GeminiEmbeddingProviderOptions } from "./embeddings/gemini-embedding.provider.ts";
