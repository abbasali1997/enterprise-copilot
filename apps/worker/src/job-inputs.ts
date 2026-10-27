import type { LLMProviderName } from "@enterprise/llm";

export type ChatGenerationJob = {
  generationId: string;
  conversationId: string;
  userId: string;
  organizationId: string;
  provider: LLMProviderName;
  model: string;
  content: string;
};

export type FinalizeDocumentJob = {
  documentId: string;
  userId: string;
  organizationId: string;
};
