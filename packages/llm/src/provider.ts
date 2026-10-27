import type {
  LLMGenerateInput,
  LLMGenerateResult,
  LLMProviderName,
  LLMStreamEvent,
} from "./types.js";

export type LLMProviderInput = LLMGenerateInput & {
  generationId: string;
};

export interface LLMProvider {
  readonly name: LLMProviderName;

  generate(input: LLMProviderInput): Promise<LLMGenerateResult>;

  stream(input: LLMProviderInput): AsyncGenerator<LLMStreamEvent>;
}

export type EmbeddingOptions =
  | { type?: "document"; title?: string }
  | { type: "query" };

export interface EmbeddingProvider {
  readonly name: LLMProviderName;
  readonly model: string;
  readonly dimensions: number;

  /** Use the same provider, model, and dimensions for documents and queries. */
  embed(text: string, options?: EmbeddingOptions): Promise<number[]>;
}
