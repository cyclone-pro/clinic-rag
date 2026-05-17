"""Chat endpoints."""

from __future__ import annotations

import json
import time
from collections.abc import AsyncGenerator

import structlog
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.db import supabase
from app.openai_errors import openai_http_exception
from app.rate_limit import limiter
from app.services.llm import LLMService
from app.services.retriever import RetrieverService

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])
retriever = RetrieverService()
llm_service = LLMService()


class ChatRequest(BaseModel):
    """Incoming chat payload."""

    question: str = Field(min_length=5, max_length=2000)


def _sse_event(event: str, data: dict[str, object]) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("/stream")
@limiter.limit("10/minute")
async def stream_chat(
    request: Request,
    payload: ChatRequest,
) -> StreamingResponse:
    """Stream a grounded response as SSE tokens and final citations."""
    chunks = retriever.search(query=payload.question)
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No indexed documents were found. Upload SOP PDFs first.",
        )

    citations = llm_service.build_citations(chunks)

    async def event_stream() -> AsyncGenerator[str, None]:
        started_at = time.perf_counter()
        answer_parts: list[str] = []
        try:
            async for token in llm_service.stream_answer(payload.question, chunks):
                answer_parts.append(token)
                yield _sse_event("token", {"token": token})
        except Exception as exc:
            if http_exc := openai_http_exception(exc):
                logger.warning("chat_stream_openai_failed", error=str(exc))
                yield _sse_event("error", {"detail": http_exc.detail})
                return
            logger.exception("chat_stream_failed", error=str(exc))
            yield _sse_event("error", {"detail": "Failed to complete streamed response."})
            return

        answer = "".join(answer_parts).strip()
        latency_ms = int((time.perf_counter() - started_at) * 1000)
        supabase.table("query_logs").insert(
            {"question": payload.question, "answer": answer, "latency_ms": latency_ms}
        ).execute()
        logger.info(
            "chat_complete",
            question=payload.question,
            latency_ms=latency_ms,
            citation_count=len(citations),
        )
        yield _sse_event("citations", {"citations": citations})
        yield _sse_event("done", {"answer": answer, "latency_ms": latency_ms})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
