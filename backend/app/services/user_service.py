"""
User service layer for business logic.
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from datetime import datetime


class UserService:
    """Service class for user operations."""

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username."""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination."""
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, user_create: UserCreate) -> User:
        """Create a new user."""
        # Check if user already exists
        if UserService.get_by_email(db, user_create.email):
            raise ValueError("User with this email already exists")

        if UserService.get_by_username(db, user_create.username):
            raise ValueError("User with this username already exists")

        # Create new user
        hashed_password = get_password_hash(user_create.password)
        db_user = User(
            email=user_create.email,
            username=user_create.username,
            hashed_password=hashed_password,
            is_active=user_create.is_active,
            is_admin=user_create.is_admin,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        """Update user."""
        user = UserService.get_by_id(db, user_id)
        if not user:
            return None

        # Check for conflicts with email/username
        if user_update.email and user_update.email != user.email:
            if UserService.get_by_email(db, user_update.email):
                raise ValueError("User with this email already exists")

        if user_update.username and user_update.username != user.username:
            if UserService.get_by_username(db, user_update.username):
                raise ValueError("User with this username already exists")

        # Update fields
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete(db: Session, user_id: int) -> bool:
        """Delete user."""
        user = UserService.get_by_id(db, user_id)
        if user:
            db.delete(user)
            db.commit()
            return True
        return False

    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user."""
        user = UserService.get_by_email(db, email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user
