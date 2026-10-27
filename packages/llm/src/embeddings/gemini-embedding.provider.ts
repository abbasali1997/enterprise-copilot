import { GoogleGenAI } from "@google/genai";
import type { EmbeddingOptions, EmbeddingProvider } from "../provider.ts";

export type GeminiEmbeddingProviderOptions = {
  dimensions?: number;
};

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly name = "gemini" as const;
  readonly model = "gemini-embedding-2";
  readonly dimensions: number;

  private readonly client: GoogleGenAI;

  constructor(apiKey: string, options: GeminiEmbeddingProviderOptions = {}) {
    if (!apiKey.trim()) {
      throw new Error("Gemini embedding API key is required");
    }

    this.dimensions = options.dimensions ?? 1536;
    if (
      !Number.isSafeInteger(this.dimensions) ||
      this.dimensions < 128 ||
      this.dimensions > 3072
    ) {
      throw new Error(
        "Gemini embedding dimensions must be an integer from 128 to 3072",
      );
    }

    this.client = new GoogleGenAI({ apiKey });
  }

  async embed(text: string, options: EmbeddingOptions = {}): Promise<number[]> {
    if (!text.trim()) {
      throw new Error("Embedding text must not be empty");
    }

    // Embedding 2 uses prompt instructions rather than the taskType parameter.
    const contents =
      options.type === "query"
        ? `task: search result | query: ${text}`
        : `title: ${options.title?.trim() || "none"} | text: ${text}`;

    const response = await this.client.models.embedContent({
      model: this.model,
      contents,
      config: { outputDimensionality: this.dimensions },
    });

    const values = response.embeddings?.[0]?.values;
    if (
      response.embeddings?.length !== 1 ||
      !values ||
      values.length !== this.dimensions ||
      !values.every(Number.isFinite)
    ) {
      throw new Error("Gemini returned an invalid embedding vector");
    }

    return values;
  }
}
