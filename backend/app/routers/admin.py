"""Admin endpoints."""

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.config import get_settings
from app.db import supabase
from app.deps import require_staff_user
from app.openai_errors import openai_http_exception
from app.rate_limit import limiter
from app.services.embedder import EmbedderService

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_staff_user)])
settings = get_settings()
embedder = EmbedderService()


@router.post("/reindex")
@limiter.limit("10/minute")
def reindex_documents(request: Request) -> dict[str, int]:
    """Re-index all uploaded documents."""
    try:
        result = embedder.reindex_directory(uploads_dir=settings.upload_dir)
    except Exception as exc:
        if http_exc := openai_http_exception(exc):
            logger.warning("admin_reindex_openai_failed", error=str(exc))
            raise http_exc from exc
        logger.exception("admin_reindex_failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to re-index documents.",
        ) from exc

    logger.info("admin_reindex_complete", **result)
    return result


@router.get("/query-logs")
@limiter.limit("10/minute")
def get_query_logs(request: Request) -> list[dict[str, str | int]]:
    """Return latest 50 query logs."""
    response = (
        supabase.table("query_logs")
        .select("id, question, answer, latency_ms, created_at")
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return response.data
