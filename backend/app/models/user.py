"""
SQLAlchemy database models.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base


class User(Base):
    """User database model with RBAC support."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # New profile fields
    firstname = Column(String, nullable=True)
    lastname = Column(String, nullable=True)
    avatar = Column(String, nullable=True)  # URL or path to avatar image

    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)  # Keep for backward compatibility
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    last_logged_in = Column(DateTime, nullable=True)  # Track last login

    # Many-to-many relationship with roles
    roles = relationship("Role", secondary="user_roles", back_populates="users")

    def has_role(self, role_name: str) -> bool:
        """Check if user has a specific role."""
        return any(role.name == role_name for role in self.roles)

    def get_role_names(self) -> list[str]:
        """Get list of role names for this user."""
        return [role.name for role in self.roles]
