"""
Secure session service for creating, listing, and deleting user sessions.
"""

from sqlalchemy.orm import Session as DBSession
from app.models.session import Session as SessionModel
from app.models.user import User
from datetime import datetime, timedelta
import secrets
import redis.asyncio as redis
import json
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


class SessionService:
    @staticmethod
    def create_session(
        db: DBSession,
        user: User,
        user_agent: str,
        ip_address: str,
        expires_in: int = 86400,
    ) -> SessionModel:
        # Generate cryptographically secure token (64 bytes = 512 bits)
        token = secrets.token_urlsafe(64)
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        session = SessionModel(
            user_id=getattr(user, "id"),
            token=token,
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=expires_at,
            is_active=True,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # Cache in Redis for fast lookups
        try:
            redis_client = redis.Redis.from_url(REDIS_URL)
            session_data = {
                "user_id": getattr(user, "id"),
                "expires_at": expires_at.isoformat(),
                "is_active": True,
            }
            redis_client.setex(f"session:{token}", expires_in, json.dumps(session_data))
        except Exception:
            pass  # Redis is optional

        return session

    @staticmethod
    def get_sessions(db: DBSession, user_id: int):
        return (
            db.query(SessionModel)
            .filter(
                SessionModel.user_id == user_id,
                SessionModel.is_active,
                SessionModel.expires_at > datetime.utcnow(),
            )
            .all()
        )

    @staticmethod
    def delete_session(db: DBSession, session_id: int, user_id: int):
        session = (
            db.query(SessionModel)
            .filter(SessionModel.id == session_id, SessionModel.user_id == user_id)
            .first()
        )
        if session:
            setattr(session, "is_active", False)
            db.commit()

            # Remove from Redis
            try:
                redis_client = redis.Redis.from_url(REDIS_URL)
                redis_client.delete(f"session:{getattr(session, 'token')}")
            except Exception:
                pass

            return True
        return False

    @staticmethod
    def delete_session_by_token(db: DBSession, token: str):
        session = (
            db.query(SessionModel)
            .filter(SessionModel.token == token, SessionModel.is_active)
            .first()
        )
        if session:
            setattr(session, "is_active", False)
            db.commit()

            # Remove from Redis
            try:
                redis_client = redis.Redis.from_url(REDIS_URL)
                redis_client.delete(f"session:{token}")
            except Exception:
                pass

            return True
        return False

    @staticmethod
    def get_session_by_token(db: DBSession, token: str):
        return (
            db.query(SessionModel)
            .filter(
                SessionModel.token == token,
                SessionModel.is_active,
                SessionModel.expires_at > datetime.utcnow(),
            )
            .first()
        )

    @staticmethod
    def cleanup_expired_sessions(db: DBSession):
        """Clean up expired sessions from database"""
        expired_sessions = (
            db.query(SessionModel)
            .filter(SessionModel.expires_at < datetime.utcnow())
            .all()
        )

        for session in expired_sessions:
            setattr(session, "is_active", False)
            # Remove from Redis
            try:
                redis_client = redis.Redis.from_url(REDIS_URL)
                redis_client.delete(f"session:{getattr(session, 'token')}")
            except Exception:
                pass

        db.commit()
        return len(expired_sessions)
