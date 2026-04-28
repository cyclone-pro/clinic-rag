"""FastAPI application entrypoint."""

import logging

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.responses import JSONResponse

from app.config import get_settings
from app.rate_limit import limiter
from app.routers import admin, auth, chat, upload

settings = get_settings()


def configure_logging() -> None:
    """Configure structured JSON logging."""
    logging.basicConfig(format="%(message)s", level=logging.INFO)
    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def create_app() -> FastAPI:
    """Build and configure the FastAPI app."""
    configure_logging()
    app = FastAPI(title=settings.app_name)

    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please wait before retrying."},
        )

    app.include_router(auth.router)
    app.include_router(upload.router)
    app.include_router(chat.router)
    app.include_router(admin.router)
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/pdf", StaticFiles(directory=settings.upload_dir), name="pdf")

    @app.get("/health")
    @limiter.limit("10/minute")
    def health_check(request: Request) -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
