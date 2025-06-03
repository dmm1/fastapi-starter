"""
Pydantic schemas for user-related operations.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


# Token schemas
class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema."""
    email: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str


# User schemas
class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: str
    is_active: bool = True
    is_admin: bool = False


class UserCreate(UserBase):
    """User creation schema."""
    password: str


class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class UserInDB(UserBase):
    """User schema for database operations."""
    id: int
    hashed_password: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class User(UserBase):
    """User response schema (without sensitive data)."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Auth schemas
class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str
