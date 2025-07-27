"""
Role model and enums for RBAC system.
"""

from enum import Enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class RoleType(str, Enum):
    """Available roles in the system."""
    ADMIN = "admin"
    USER = "user" 
    MODERATOR = "moderator"
    VIEWER = "viewer"


# Association table for many-to-many relationship between users and roles
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('assigned_at', DateTime, default=datetime.utcnow)
)


class Role(Base):
    """Role database model for RBAC."""
    
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, index=True, nullable=False)  # RoleType enum value
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Many-to-many relationship with users
    users = relationship("User", secondary=user_roles, back_populates="roles")