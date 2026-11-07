import { can, PERMISSIONS, type OrganizationRole } from "@enterprise/auth";
import { GeminiEmbeddingProvider } from "@enterprise/llm";
import { z } from "zod";
import {
  searchDocumentChunks,
  type ChunkSearchInput,
  type RetrievedChunk,
} from "../repositories/retrieval.repository.js";
import { logOperation } from "../utils/log-operation.js";

const MODEL_NAME = "gemini-embedding-2";
const DIMENSIONS = 1536;

const retrievalInputSchema = z.object({
  organizationId: z.uuid(),
  query: z.string().trim().min(1).max(8000),
  topK: z.number().int().min(1).max(50).default(5),
  minScore: z.number().min(-1).max(1).default(0),
  documentIds: z.array(z.uuid()).max(100).optional(),
});

export type RetrievalInput = z.input<typeof retrievalInputSchema>;
export type RetrievalDependencies = {
  embedQuery: (query: string) => Promise<number[]>;
  searchChunks: (input: ChunkSearchInput) => Promise<RetrievedChunk[]>;
};

let embeddingProvider: GeminiEmbeddingProvider | undefined;
const embedQuery = (query: string) => {
  // Initialize only when retrieval is requested; importing this service does
  // not start workers or require a provider key.
  embeddingProvider ??= new GeminiEmbeddingProvider(
    process.env.GEMINI_API_KEY ?? "",
    { dimensions: DIMENSIONS },
  );
  return embeddingProvider.embed(query, { type: "query" });
};

/** Internal RAG retrieval. Pass the authenticated tenant and role from the caller. */
export const createRetrievalService =
  (
    dependencies: RetrievalDependencies = {
      embedQuery,
      searchChunks: searchDocumentChunks,
    },
  ) =>
  async (
    input: RetrievalInput,
    role: OrganizationRole,
  ): Promise<RetrievedChunk[]> => {
    if (!can(role, PERMISSIONS.DOCUMENT_READ)) {
      throw new Error("You do not have permission to read documents");
    }
    const parsed = retrievalInputSchema.parse(input);
    return logOperation(
      "document.retrieve",
      { organizationId: parsed.organizationId, topK: parsed.topK },
      async () => {
        if (parsed.documentIds?.length === 0) return [];
        const embedding = await dependencies.embedQuery(parsed.query);
        if (
          embedding.length !== DIMENSIONS ||
          !embedding.every(Number.isFinite) ||
          !embedding.some((value) => value !== 0)
        ) {
          throw new Error(
            "Query embedding must be a non-zero, finite 1536-dimensional vector",
          );
        }
        return dependencies.searchChunks({
          organizationId: parsed.organizationId,
          embedding,
          modelName: MODEL_NAME,
          topK: parsed.topK,
          minScore: parsed.minScore,
          documentIds: parsed.documentIds,
        });
      },
    );
  };
