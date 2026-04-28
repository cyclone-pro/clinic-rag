"""Helpers for converting OpenAI SDK errors into API responses."""

from fastapi import HTTPException, status
from openai import APIStatusError, RateLimitError


def openai_http_exception(exc: Exception) -> HTTPException | None:
    """Return an HTTPException for known OpenAI quota/rate-limit failures."""
    if isinstance(exc, RateLimitError):
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "OpenAI quota or rate limit exceeded. Check your OpenAI billing, "
                "plan limits, or API key."
            ),
        )

    if isinstance(exc, APIStatusError) and exc.status_code == 429:
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="OpenAI rate limit exceeded. Please retry later.",
        )

    return None
