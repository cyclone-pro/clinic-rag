"""Evaluate retrieval hit_rate@5 for ClinicDocs AI."""

from __future__ import annotations

import json
from pathlib import Path

import structlog
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.services.retriever import RetrieverService

logger = structlog.get_logger(__name__)


def evaluate() -> dict[str, float | int]:
    """Run retrieval benchmark against ground truth pairs."""
    gt_path = Path(__file__).parent / "ground_truth.json"
    test_cases = json.loads(gt_path.read_text(encoding="utf-8"))
    retriever = RetrieverService()

    hits = 0
    total = len(test_cases)

    db: Session = SessionLocal()
    try:
        for case in test_cases:
            results = retriever.search(db=db, query=case["question"], top_k=5)
            matched = any(
                row.source_file == case["expected_source_file"]
                and row.page_number == case["expected_page"]
                for row in results
            )
            if matched:
                hits += 1
    finally:
        db.close()

    hit_rate = hits / total if total else 0.0
    report = {"total": total, "hits": hits, "hit_rate_at_5": round(hit_rate, 4)}
    logger.info("retrieval_eval_report", **report)
    return report


if __name__ == "__main__":
    evaluate()

