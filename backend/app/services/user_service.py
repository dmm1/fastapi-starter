"""
User service for managing user operations with RBAC support.
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from app.services.role_service import RoleService
from app.models.role import RoleType
from datetime import datetime


class UserService:
    """Service class for user operations with role management."""

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
        """Create a new user with role assignment."""
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
            firstname=user_create.firstname,
            lastname=user_create.lastname,
            avatar=user_create.avatar,
            hashed_password=hashed_password,
            is_active=user_create.is_active,
            is_admin=user_create.is_admin,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Assign roles
        if hasattr(user_create, "roles") and user_create.roles:
            for role in user_create.roles:
                RoleService.assign_role_to_user(
                    db, db_user, role.value if isinstance(role, RoleType) else role
                )
        else:
            # Assign default role
            RoleService.assign_default_role(db, db_user)

        return db_user

    @staticmethod
    def update(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        """Update user with role management."""
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

        # Handle role updates separately
        update_data = (
            user_update.model_dump(exclude_unset=True)
            if hasattr(user_update, "model_dump")
            else user_update.dict(exclude_unset=True)
        )

        if "roles" in update_data:
            roles_to_assign = update_data.pop("roles")
            # Clear existing roles and assign new ones
            user.roles.clear()
            for role in roles_to_assign:
                role_name = role.value if isinstance(role, RoleType) else role
                RoleService.assign_role_to_user(db, user, role_name)

        # Update other fields
        for field, value in update_data.items():
            setattr(user, field, value)

        user.updated_at = datetime.now()
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
        """Authenticate user and update last login."""
        user = UserService.get_by_email(db, email)
        if not user or not verify_password(password, user.hashed_password):
            return None

        # Update last login time
        user.last_logged_in = datetime.now()
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def change_password(
        db: Session, user_id: int, current_password: str, new_password: str
    ) -> bool:
        """Change user password after verifying current password."""
        user = UserService.get_by_id(db, user_id)
        if not user:
            return False

        # Verify current password
        if not verify_password(current_password, user.hashed_password):
            return False

        # Update password
        user.hashed_password = get_password_hash(new_password)
        user.updated_at = datetime.now()
        db.commit()
        return True
