import { randomUUID } from "node:crypto";
import type { LLMGenerateInput, LLMProviderName } from "./types.js";
import type {
  LLMProvider,
  EmbeddingProvider,
  EmbeddingOptions,
} from "./provider.js";
import { LLMProviderError } from "./errors.js";

export type LLMGatewayRequest = LLMGenerateInput & {
  provider: LLMProviderName;
};

export class LLMGateway {
  private readonly providers = new Map<LLMProviderName, LLMProvider>();

  constructor(providers: LLMProvider[]) {
    for (const provider of providers) {
      this.providers.set(provider.name, provider);
    }
  }

  private getProvider(name: LLMProviderName) {
    const provider = this.providers.get(name);

    if (!provider) {
      throw new LLMProviderError({
        provider: name,
        code: "BAD_REQUEST",
        message: `LLM provider "${name}" is not configured`,
      });
    }

    return provider;
  }

  async generate(request: LLMGatewayRequest) {
    const provider = this.getProvider(request.provider);
    const generationId = request.generationId ?? randomUUID();

    return provider.generate({
      ...request,
      generationId,
    });
  }

  async *stream(request: LLMGatewayRequest) {
    const provider = this.getProvider(request.provider);

    const generationId = request.generationId ?? randomUUID();

    yield* provider.stream({
      ...request,
      generationId,
    });
  }
}

export type EmbeddingGatewayRequest = {
  provider: LLMProviderName;
  text: string;
  options?: EmbeddingOptions;
};

export class EmbeddingGateway {
  private readonly providers = new Map<LLMProviderName, EmbeddingProvider>();

  constructor(providers: EmbeddingProvider[]) {
    for (const provider of providers) {
      if (this.providers.has(provider.name)) {
        throw new LLMProviderError({
          provider: provider.name,
          code: "BAD_REQUEST",
          message: `Embedding provider "${provider.name}" is already configured`,
        });
      }
      this.providers.set(provider.name, provider);
    }
  }

  async embed(request: EmbeddingGatewayRequest): Promise<number[]> {
    const provider = this.providers.get(request.provider);
    if (!provider) {
      throw new LLMProviderError({
        provider: request.provider,
        code: "BAD_REQUEST",
        message: `Embedding provider "${request.provider}" is not configured`,
      });
    }

    return provider.embed(request.text, request.options);
  }
}
