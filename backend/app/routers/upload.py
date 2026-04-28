"""Upload and indexing endpoints."""

from pathlib import Path

import structlog
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status

from app.config import get_settings
from app.deps import require_staff_user
from app.openai_errors import openai_http_exception
from app.rate_limit import limiter
from app.services.embedder import EmbedderService

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"], dependencies=[Depends(require_staff_user)])
settings = get_settings()
embedder = EmbedderService()


@router.post("/pdf")
@limiter.limit("10/minute")
async def upload_pdf(
    request: Request,
    file: UploadFile = File(...),
) -> dict[str, str | int]:
    """Upload and index a PDF."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed.")

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    destination = Path(settings.upload_dir) / file.filename
    destination.write_bytes(payload)

    try:
        result = embedder.index_pdf_bytes(filename=file.filename, pdf_bytes=payload)
    except Exception as exc:
        if http_exc := openai_http_exception(exc):
            logger.warning("upload_openai_failed", filename=file.filename, error=str(exc))
            raise http_exc from exc
        logger.exception("upload_index_failed", filename=file.filename, error=str(exc))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to index PDF.") from exc

    return {
        "source_file": result.source_file,
        "pages_processed": result.pages_processed,
        "chunks_created": result.chunks_created,
        "extraction_summary": result.extraction_summary,
    }
