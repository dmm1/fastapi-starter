"""
Database session management and dependencies.
"""

from typing import Generator
from sqlalchemy.orm import Session
from app.db.base import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Database dependency for FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    from app.db.base import Base, engine
    from app.models.user import User  # Import all models to register them

    # Ensure all models are loaded (User is needed for metadata creation)
    _ = User
    Base.metadata.create_all(bind=engine)


def init_db():
    """Initialize database with default data."""
    from app.models.user import User
    from app.core.security import get_password_hash
    from app.core.config import settings
    from datetime import datetime

    db = SessionLocal()
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.email == settings.admin_email).first()
        if not admin_user:
            # Create default admin user
            admin_user = User(
                email=settings.admin_email,
                username=settings.admin_username,
                hashed_password=get_password_hash(settings.admin_password),
                is_active=True,
                is_admin=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(admin_user)
            db.commit()
            print(
                f"✅ Default admin user created: {settings.admin_email} / {settings.admin_password}"
            )
        else:
            print("✅ Default admin user already exists")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()
