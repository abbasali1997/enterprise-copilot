-- Enable pgvector in this database before using its vector type.
CREATE EXTENSION IF NOT EXISTS vector;

-- Preserve existing embeddings while aligning storage with the Prisma schema.
ALTER TABLE "DocumentChunk"
  ALTER COLUMN "embedding" TYPE vector
  USING "embedding"::vector;
