-- Enable pgvector in this database.
CREATE EXTENSION IF NOT EXISTS vector;

-- Preserve existing embeddings while converting from PostgreSQL arrays.
-- Set a fixed dimension once the embedding model is selected.
ALTER TABLE "DocumentChunk"
    ALTER COLUMN "embedding" TYPE vector
    USING "embedding"::vector;
