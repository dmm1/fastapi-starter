"""
Core configuration and settings for the Fastapi-Starter Backend API.
"""

from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings with enhanced security and Python 3.12+ features."""

    # API Configuration
    app_name: str = "Fastapi-Starter Backend API"
    version: str = "2.0.0"  # Updated version for RBAC support
    description: str = "A modern authentication system with FastAPI and RBAC"

    # Security
    SECRET_KEY: str = "changeme-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    @property
    def secret_key(self) -> str:
        """Get secret key (backward compatibility)."""
        return self.SECRET_KEY

    # Database
    database_url: str = "sqlite:///./data/auth.db"

    # CORS - Using Python 3.12 union syntax would be List[str] | str but keeping compatible
    backend_cors_origins: List[str] = ["*"]  # Configure properly in production

    # Admin User - These MUST be set in .env file or will use defaults for development
    admin_email: str = "admin@example.com"
    admin_username: str = "admin"
    admin_password: str = "adminpassword"

    # Password policy settings
    min_password_length: int = 8
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_numbers: bool = True
    require_special_chars: bool = True

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    class Config:
        env_file = "backend/.env"
        extra = "allow"  # Allow extra fields from .env


# Global settings instance
settings = Settings()
