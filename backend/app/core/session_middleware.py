"""
Secure session validation middleware for JWT and session token.
Uses Redis for fast session lookup with fallback to DB.
Only validates sessions for protected endpoints.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.db.session import get_db
from app.services.session_service import SessionService
import redis.asyncio as redis
import os
import json
from datetime import datetime

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_pool = None

# Protected endpoints that require session validation
PROTECTED_PATHS = ["/api/v1/users", "/api/v1/sessions", "/api/v1/admin"]
PUBLIC_PATHS = [
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/health",
    "/docs",
    "/openapi.json",
]


async def get_redis_client():
    global redis_pool
    if redis_pool is None:
        try:
            redis_pool = redis.ConnectionPool.from_url(REDIS_URL, max_connections=20)
        except Exception:
            return None
    return redis.Redis(connection_pool=redis_pool)


class SessionValidationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip validation for public endpoints
        if any(request.url.path.startswith(path) for path in PUBLIC_PATHS):
            return await call_next(request)

        session_token = request.cookies.get("session_token")

        # Only validate for protected endpoints
        if (
            any(request.url.path.startswith(path) for path in PROTECTED_PATHS)
            and session_token
        ):
            redis_client = await get_redis_client()

            if redis_client:
                try:
                    session_data = await redis_client.get(f"session:{session_token}")
                    if session_data:
                        session_info = json.loads(session_data)
                        # Check expiration
                        if (
                            datetime.fromisoformat(session_info["expires_at"])
                            < datetime.utcnow()
                        ):
                            await redis_client.delete(f"session:{session_token}")
                            return Response("Session expired", status_code=401)
                    else:
                        # Fallback to DB check
                        db_gen = get_db()
                        db = next(db_gen)
                        try:
                            session_obj = SessionService.get_session_by_token(
                                db, session_token
                            )
                            if not session_obj or not getattr(
                                session_obj, "is_active", False
                            ):
                                return Response("Session invalid", status_code=401)
                            # Check expiration
                            expires_at = getattr(session_obj, "expires_at", None)
                            if expires_at and expires_at < datetime.utcnow():
                                SessionService.delete_session_by_token(
                                    db, session_token
                                )
                                return Response("Session expired", status_code=401)
                        finally:
                            db.close()
                except Exception:
                    # Redis error, fallback to DB
                    db_gen = get_db()
                    db = next(db_gen)
                    try:
                        session_obj = SessionService.get_session_by_token(
                            db, session_token
                        )
                        if not session_obj or not getattr(
                            session_obj, "is_active", False
                        ):
                            return Response("Session invalid", status_code=401)
                    finally:
                        db.close()

        return await call_next(request)
