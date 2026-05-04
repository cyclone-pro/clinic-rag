-- Cloudflare Workers AI embeddings use @cf/baai/bge-base-en-v1.5 by default.
-- That model returns 768-dimensional vectors, not OpenAI's 1536 dimensions.
-- Run this in Supabase SQL Editor for the Cloudflare backend.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    source_file VARCHAR(255) NOT NULL,
    page_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS query_logs (
    id BIGSERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP FUNCTION IF EXISTS match_documents(vector, int);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'documents'
          AND column_name = 'embedding'
          AND udt_name = 'vector'
    ) THEN
        TRUNCATE TABLE documents;
        ALTER TABLE documents ALTER COLUMN embedding TYPE vector(768);
    END IF;
END $$;

DROP INDEX IF EXISTS documents_embedding_ivfflat_idx;
CREATE INDEX documents_embedding_ivfflat_idx
ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(768),
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id bigint,
    content text,
    source_file text,
    page_number integer,
    distance float8
)
LANGUAGE sql STABLE
AS $$
    SELECT id, content, source_file::text, page_number,
           (embedding <=> query_embedding)::float8 AS distance
    FROM documents
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;
