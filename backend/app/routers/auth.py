"""Supabase Auth endpoints."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.config import get_settings
from app.db import supabase_auth

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


class LoginRequest(BaseModel):
    """Email/password login payload."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


@router.post("/login")
def login_user(payload: LoginRequest) -> dict[str, str | int]:
    """Authenticate clinic staff using Supabase Auth."""
    if not settings.supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_ANON_KEY is required for Supabase Auth login.",
        )

    try:
        response = supabase_auth.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password."
        ) from exc

    if not response.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unable to create auth session."
        )

    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
        "expires_at": response.session.expires_at or 0,
        "token_type": "bearer",
    }
