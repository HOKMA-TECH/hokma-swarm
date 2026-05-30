-- 010_rag_knowledge_base.sql
-- Base de conhecimento RAG para o agente "02 CORRETOR-AGENTE".
-- IMPORTANTE: o schema segue o CONTRATO do node nativo do n8n
-- "Supabase Vector Store" (@n8n/n8n-nodes-langchain.vectorStoreSupabase):
-- colunas (id, content, metadata, embedding) + funcao match_* com
-- assinatura (query_embedding, match_count, filter). Nao altere os nomes
-- de colunas/funcao senao o node nativo para de funcionar.
--
-- Dimensao do vetor = 1536 (OpenAI text-embedding-3-small).
-- O node "Embeddings OpenAI" usa esse modelo por padrao.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_base (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content    TEXT,
  metadata   JSONB,
  embedding  VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice ANN por similaridade de cosseno
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding
  ON knowledge_base USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Funcao de match compativel com o Supabase Vector Store node do n8n.
-- Configure no node: Table Name = knowledge_base | Query Name = match_knowledge
CREATE OR REPLACE FUNCTION match_knowledge (
  query_embedding VECTOR(1536),
  match_count INT DEFAULT NULL,
  filter JSONB DEFAULT '{}'
) RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    id,
    content,
    metadata,
    1 - (knowledge_base.embedding <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE metadata @> filter
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
