"""PDF extraction, chunking, and embedding service."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Literal

import pytesseract
import structlog
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pdf2image import convert_from_bytes
from pypdf import PdfReader

from app.config import get_settings
from app.db import supabase

logger = structlog.get_logger(__name__)
settings = get_settings()


@dataclass
class ExtractedPage:
    """Represents extracted text content from a PDF page."""

    page_number: int
    content: str
    extraction_mode: Literal["native", "ocr"]


@dataclass
class IndexResult:
    """Result metadata after indexing a PDF."""

    source_file: str
    pages_processed: int
    chunks_created: int
    extraction_summary: str


class EmbedderService:
    """Handles document ingestion and embedding persistence."""

    def __init__(self) -> None:
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        self._embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            api_key=settings.openai_api_key,
        )

    def index_pdf_bytes(self, filename: str, pdf_bytes: bytes) -> IndexResult:
        """Extract, split, embed, and store chunks from a PDF payload."""
        extracted_pages = self._extract_pages(pdf_bytes=pdf_bytes)
        native_count = 0
        ocr_count = 0
        pending: list[tuple[ExtractedPage, str]] = []

        for page in extracted_pages:
            if page.extraction_mode == "native":
                native_count += 1
            else:
                ocr_count += 1
            for chunk in self._splitter.split_text(page.content):
                if chunk.strip():
                    pending.append((page, chunk))

        if pending:
            texts = [chunk for _, chunk in pending]
            vectors = self._embeddings.embed_documents(texts)
            rows = [
                {
                    "content": chunk,
                    "embedding": f"[{','.join(str(v) for v in vector)}]",
                    "source_file": filename,
                    "page_number": page.page_number,
                }
                for (page, chunk), vector in zip(pending, vectors)
            ]
            supabase.table("documents").insert(rows).execute()

        summary = self._build_summary(native_count=native_count, ocr_count=ocr_count)
        logger.info(
            "pdf_indexed",
            filename=filename,
            pages=len(extracted_pages),
            chunks=len(pending),
            extraction_summary=summary,
        )
        return IndexResult(
            source_file=filename,
            pages_processed=len(extracted_pages),
            chunks_created=len(pending),
            extraction_summary=summary,
        )

    def reindex_directory(self, uploads_dir: Path) -> dict[str, int]:
        """Rebuild the vector index from all PDFs in the upload directory."""
        uploads_dir.mkdir(parents=True, exist_ok=True)
        supabase.table("documents").delete().gte("id", 1).execute()

        indexed_files = 0
        total_chunks = 0

        for pdf_path in sorted(uploads_dir.glob("*.pdf")):
            result = self.index_pdf_bytes(filename=pdf_path.name, pdf_bytes=pdf_path.read_bytes())
            indexed_files += 1
            total_chunks += result.chunks_created

        logger.info("reindex_complete", indexed_files=indexed_files, chunks=total_chunks)
        return {"indexed_files": indexed_files, "chunks": total_chunks}

    def _extract_pages(self, pdf_bytes: bytes) -> list[ExtractedPage]:
        """Extract text from native pages and fallback to OCR for scanned pages."""
        reader = PdfReader(BytesIO(pdf_bytes))
        pages: list[ExtractedPage] = []

        for idx, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            if len(text) >= 20:
                pages.append(ExtractedPage(page_number=idx, content=text, extraction_mode="native"))
                continue

            try:
                images = convert_from_bytes(pdf_bytes, first_page=idx, last_page=idx)
            except Exception:
                logger.warning("ocr_unavailable_poppler_missing", page=idx)
                continue

            if not images:
                logger.warning("ocr_image_missing", page=idx)
                continue

            ocr_text = pytesseract.image_to_string(images[0]).strip()
            if not ocr_text:
                logger.warning("empty_page_text", page=idx)
                continue
            pages.append(ExtractedPage(page_number=idx, content=ocr_text, extraction_mode="ocr"))

        return pages

    @staticmethod
    def _build_summary(native_count: int, ocr_count: int) -> str:
        if native_count > 0 and ocr_count > 0:
            return "mixed"
        if ocr_count > 0:
            return "scanned"
        return "native"
