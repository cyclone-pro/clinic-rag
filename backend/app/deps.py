"""Authentication and shared API dependencies."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings
from app.db import supabase_auth

auth_scheme = HTTPBearer(auto_error=True)
settings = get_settings()


def require_staff_user(
    credentials: HTTPAuthorizationCredentials = Depends(auth_scheme),
) -> dict[str, str]:
    """Validate Supabase JWT and return basic user metadata."""
    if not settings.supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_ANON_KEY is required for Supabase Auth token validation.",
        )

    try:
        user_response = supabase_auth.auth.get_user(credentials.credentials)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired auth token.",
        ) from exc

    if not user_response.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized.",
        )

    return {"user_id": user_response.user.id, "email": user_response.user.email or ""}
