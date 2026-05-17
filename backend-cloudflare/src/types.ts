export type Env = {
  AI: Ai;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_STORAGE_BUCKET?: string;
  ALLOWED_ORIGINS?: string;
  RETRIEVAL_K?: string;
  CHUNK_SIZE?: string;
  CHUNK_OVERLAP?: string;
  CHAT_MODEL?: string;
  EMBEDDING_MODEL?: string;
};

export type QueryLog = {
  id: number;
  question: string;
  answer: string;
  latency_ms: number;
  created_at: string;
};

export type RetrievedChunk = {
  id: number;
  content: string;
  source_file: string;
  page_number: number;
  distance: number;
};

export type SupabaseUser = {
  id: string;
  email?: string;
};


export type EmbeddingResponse = {
  data: number[][];
};

export type ChatResponse = {
  response?: string;
  result?: {
    response?: string;
  };
};

export type Citation = {
  file: string;
  page: number;
  snippet: string;
};
