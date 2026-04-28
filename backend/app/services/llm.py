"""LangChain-powered RAG generation service."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from dataclasses import asdict, dataclass

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.config import get_settings
from app.services.retriever import RetrievedChunk

settings = get_settings()


@dataclass
class Citation:
    """Citation metadata returned to the client."""

    file: str
    page: int
    snippet: str


class LLMService:
    """Builds and streams grounded answers from retrieved chunks."""

    def __init__(self) -> None:
        self._llm = ChatOpenAI(
            model=settings.model_name,
            api_key=settings.openai_api_key,
            temperature=0.1,
        )

    async def stream_answer(
        self, question: str, chunks: list[RetrievedChunk]
    ) -> AsyncGenerator[str, None]:
        """Yield answer tokens incrementally."""
        context = self._format_context(chunks)
        messages = [
            SystemMessage(
                content=(
                    "You are ClinicDocs AI. Answer using only provided SOP context. "
                    "If the answer is not in context, say you cannot find it in SOP docs."
                )
            ),
            HumanMessage(
                content=f"Question:\n{question}\n\nContext:\n{context}\n\nRespond in concise staff-friendly language."
            ),
        ]
        async for chunk in self._llm.astream(messages):
            if isinstance(chunk.content, str) and chunk.content:
                yield chunk.content

    def build_citations(self, chunks: list[RetrievedChunk]) -> list[dict[str, str | int]]:
        """Return unique citations from retrieved chunks."""
        seen: set[tuple[str, int]] = set()
        citations: list[dict[str, str | int]] = []
        for item in chunks:
            key = (item.source_file, item.page_number)
            if key in seen:
                continue
            seen.add(key)
            snippet = item.content[:180].strip().replace("\n", " ")
            citations.append(
                asdict(Citation(file=item.source_file, page=item.page_number, snippet=snippet))
            )
        return citations

    @staticmethod
    def _format_context(chunks: list[RetrievedChunk]) -> str:
        sections: list[str] = []
        for chunk in chunks:
            sections.append(
                f"[{chunk.source_file} p.{chunk.page_number}] {chunk.content}"
            )
        return "\n\n".join(sections)

