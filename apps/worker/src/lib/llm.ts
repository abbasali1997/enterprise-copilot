import { LLMGateway, OpenAIProvider, GeminiProvider } from "@enterprise/llm";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

export const llmGateway = new LLMGateway([
  // @ts-ignore
  new OpenAIProvider(process.env.OPENAI_API_KEY),
  // @ts-ignore
  new GeminiProvider(process.env.GEMINI_API_KEY),
]);
