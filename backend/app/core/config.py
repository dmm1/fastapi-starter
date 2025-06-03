"""
Core configuration and settings for the Fastapi-Starter Backend API.
"""

from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    """Application settings."""

    # API Configuration
    app_name: str = "Fastapi-Starter Backend API"
    version: str = "1.0.0"
    description: str = "A modern authentication system with FastAPI"

    # Security
    SECRET_KEY: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    @property
    def secret_key(self) -> str:
        """Get secret key (backward compatibility)."""
        return self.SECRET_KEY

    # Database
    database_url: str = "sqlite:///./data/auth.db"

    # CORS
    backend_cors_origins: List[str] = ["*"]  # Configure properly in production

    # Admin User - These MUST be set in .env file
    admin_email: str
    admin_username: str
    admin_password: str

    @validator("backend_cors_origins", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    class Config:
        env_file = ".env"
        extra = "allow"  # Allow extra fields from .env


# Global settings instance
settings = Settings()
