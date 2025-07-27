"""
Pydantic schemas for user-related operations.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator
from app.models.role import RoleType


# Token schemas
class Token(BaseModel):
    """Token response schema with role information."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema with roles."""
    email: Optional[str] = None
    roles: list[str] = []


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str


# Role schemas
class RoleBase(BaseModel):
    """Base role schema."""
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    """Role creation schema."""
    pass


class Role(RoleBase):
    """Role response schema."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# User schemas
class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: str
    is_active: bool = True
    is_admin: bool = False


class UserCreate(UserBase):
    """User creation schema with password validation."""
    password: str
    roles: list[RoleType] = []  # Optional roles during creation

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("Password must contain at least one special character")
        
        return v


class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    roles: Optional[list[RoleType]] = None


class UserInDB(UserBase):
    """User schema for database operations."""
    id: int
    hashed_password: str
    created_at: datetime
    updated_at: datetime
    roles: list[Role] = []

    class Config:
        from_attributes = True


class User(UserBase):
    """User response schema (without sensitive data) with roles."""
    id: int
    created_at: datetime
    updated_at: datetime
    roles: list[Role] = []

    class Config:
        from_attributes = True


# Auth schemas
class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str


class UserRoleUpdate(BaseModel):
    """Schema for updating user roles."""
    user_id: int
    roles: list[RoleType]
