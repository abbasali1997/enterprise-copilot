import { Prisma, prisma, type DbClient } from "@enterprise/db";

export type RetrievedChunk = {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  chunkIndex: number;
  content: string;
  score: number;
};

export type ChunkSearchInput = {
  organizationId: string;
  embedding: number[];
  modelName: string;
  topK: number | 8;
  minScore: number | 0.5;
  documentIds?: string[];
};

export const searchDocumentChunks = (
  input: ChunkSearchInput,
  db: DbClient = prisma,
): Promise<RetrievedChunk[]> => {
  // Materialize the eligible vectors before computing distance: other models
  // or dimensions may coexist in this unbounded pgvector column.
  const documentFilter =
    input.documentIds === undefined
      ? Prisma.empty
      : input.documentIds.length === 0
        ? Prisma.sql`AND FALSE`
        : Prisma.sql`AND a."id" IN (${Prisma.join(input.documentIds)})`;

  return db.$queryRaw<RetrievedChunk[]>(Prisma.sql`
    WITH eligible AS MATERIALIZED (
      SELECT c."id", c."documentId", a."name" AS "documentName",
             c."pageNumber", c."chunkIndex", c."content", c."embedding"
      FROM "DocumentChunk" c
      JOIN "Attachment" a ON a."id" = c."documentId"
      WHERE a."organizationId" = ${input.organizationId}
        AND a."status" = 'READY'
        AND a."type" = 'DOCUMENT'
        AND c."modelName" = ${input.modelName}
        AND c."embedding" IS NOT NULL
        AND vector_dims(c."embedding") = ${input.embedding.length}
        AND vector_norm(c."embedding") > 0
        ${documentFilter}
    ), ranked AS (
      SELECT "id", "documentId", "documentName", "pageNumber", "chunkIndex",
             "content", 1 - ("embedding" <=> ${JSON.stringify(input.embedding)}::vector) AS "score"
      FROM eligible
    )
    SELECT * FROM ranked
    WHERE "score" >= ${input.minScore}
    ORDER BY "score" DESC, "id" ASC
    LIMIT ${input.topK}
  `);
};
