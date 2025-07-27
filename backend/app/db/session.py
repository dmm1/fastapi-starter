"""
Database session management and dependencies with RBAC support.
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
    from app.models.role import Role, user_roles  # Import role models

    # Ensure all models are loaded
    _ = User, Role, user_roles
    Base.metadata.create_all(bind=engine)


def init_db():
    """Initialize database with default data including roles."""
    from app.models.user import User
    from app.services.role_service import RoleService
    from app.core.security import get_password_hash
    from app.core.config import settings
    from datetime import datetime

    db = SessionLocal()
    try:
        # Create default roles first
        RoleService.create_default_roles(db)
        
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
            db.refresh(admin_user)
            
            # Assign admin roles
            RoleService.assign_default_role(db, admin_user)
            
            print(
                f"✅ Default admin user created: {settings.admin_email} / {settings.admin_password}"
            )
        else:
            # Ensure existing admin has proper roles
            if not admin_user.has_role("admin"):
                RoleService.assign_role_to_user(db, admin_user, "admin")
                print(f"✅ Admin role assigned to existing user: {settings.admin_email}")
            print("✅ Default admin user already exists")
            
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()
