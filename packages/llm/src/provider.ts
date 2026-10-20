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
