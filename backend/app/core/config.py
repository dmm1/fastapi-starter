"""
Core configuration and settings for the Fastapi-Starter Backend API.
"""

from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, Field


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
    admin_email: str = Field(default="", alias="ADMIN_EMAIL")
    admin_username: str = Field(default="", alias="ADMIN_USERNAME")
    admin_password: str = Field(default="", alias="ADMIN_PASSWORD")

    # Password policy settings
    min_password_length: int = 8
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_numbers: bool = True
    require_special_chars: bool = True
    createmin: bool = Field(
        default=False, alias="CREATEMIN"
    )  # If True, create admin user on startup

    # SSL/Security Configuration
    secure_cookies: bool = Field(default=False, alias="SECURE_COOKIES")
    https_only: bool = Field(default=False, alias="HTTPS_ONLY")

    # Rate Limiting Configuration
    default_rate_limit: str = Field(default="1000 per hour", alias="DEFAULT_RATE_LIMIT")

    # Authentication Rate Limits
    auth_login_rate_limit: str = Field(
        default="5 per minute", alias="AUTH_LOGIN_RATE_LIMIT"
    )
    auth_register_rate_limit: str = Field(
        default="3 per minute", alias="AUTH_REGISTER_RATE_LIMIT"
    )
    auth_refresh_rate_limit: str = Field(
        default="10 per minute", alias="AUTH_REFRESH_RATE_LIMIT"
    )

    # API Rate Limits
    api_general_rate_limit: str = Field(
        default="100 per minute", alias="API_GENERAL_RATE_LIMIT"
    )
    api_user_profile_rate_limit: str = Field(
        default="30 per minute", alias="API_USER_PROFILE_RATE_LIMIT"
    )

    # Admin Rate Limits
    admin_operations_rate_limit: str = Field(
        default="50 per minute", alias="ADMIN_OPERATIONS_RATE_LIMIT"
    )

    # Monitoring Rate Limits
    health_check_rate_limit: str = Field(
        default="60 per minute", alias="HEALTH_CHECK_RATE_LIMIT"
    )
    metrics_rate_limit: str = Field(default="10 per minute", alias="METRICS_RATE_LIMIT")

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=".env", env_prefix="", extra="allow"  # Allow extra fields from .env
    )


# Global settings instance
settings = Settings()
