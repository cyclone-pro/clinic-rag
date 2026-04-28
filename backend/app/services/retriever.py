"""Vector retrieval service backed by pgvector via Supabase RPC."""

from __future__ import annotations

from dataclasses import dataclass

from langchain_openai import OpenAIEmbeddings

from app.config import get_settings
from app.db import supabase

settings = get_settings()


@dataclass
class RetrievedChunk:
    """Single retrieval result."""

    id: int
    content: str
    source_file: str
    page_number: int
    distance: float


class RetrieverService:
    """Queries nearest chunks using cosine distance via Supabase RPC."""

    def __init__(self) -> None:
        self._embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            api_key=settings.openai_api_key,
        )

    def search(self, query: str, top_k: int | None = None) -> list[RetrievedChunk]:
        """Retrieve top matching chunks."""
        k = top_k or settings.retrieval_k
        query_vector = self._embeddings.embed_query(query)

        response = supabase.rpc(
            "match_documents",
            {
                "query_embedding": f"[{','.join(str(v) for v in query_vector)}]",
                "match_count": k,
            },
        ).execute()

        return [
            RetrievedChunk(
                id=row["id"],
                content=row["content"],
                source_file=row["source_file"],
                page_number=row["page_number"],
                distance=row["distance"],
            )
            for row in response.data
        ]
