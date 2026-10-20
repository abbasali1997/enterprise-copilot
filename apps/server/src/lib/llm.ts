import { LLMGateway, OpenAIProvider } from "@enterprise/llm";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

export const llmGateway = new LLMGateway([
  new OpenAIProvider(process.env.OPENAI_API_KEY),
]);
