import {
  LLMGateway,
  OpenAIProvider,
  GeminiProvider,
  EmbeddingGateway,
  GeminiEmbeddingProvider,
} from "@enterprise/llm";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required");
}

export const llmGateway = new LLMGateway([
  // @ts-ignore
  new OpenAIProvider(process.env.OPENAI_API_KEY),
  // @ts-ignore
  new GeminiProvider(process.env.GEMINI_API_KEY),
]);

export const embeddingGateway = new EmbeddingGateway([
  new GeminiEmbeddingProvider(process.env.GEMINI_API_KEY, {
    dimensions: 1536,
  }),
]);
