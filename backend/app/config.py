"""Application settings."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ClinicDocs AI"
    environment: str = Field(default="development", alias="ENVIRONMENT")

    openai_api_key: str = Field(alias="OPENAI_API_KEY")
    supabase_url: str = Field(alias="SUPABASE_URL")
    supabase_anon_key: str | None = Field(default=None, alias="SUPABASE_ANON_KEY")
    supabase_service_key: str = Field(alias="SUPABASE_SERVICE_KEY")

    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    upload_dir: Path = Path("data/uploads")
    chunk_size: int = 800
    chunk_overlap: int = 100
    retrieval_k: int = 5

    model_name: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"

    @field_validator("supabase_url", mode="before")
    @classmethod
    def normalise_supabase_url(cls, v: str) -> str:
        return v.rstrip("/").removesuffix("/rest/v1").rstrip("/")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached settings instance."""
    return Settings()  # type: ignore[call-arg]
