"""
Rate limiting utilities using SlowAPI.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException
import redis
import os
import logging

# Setup logging
logger = logging.getLogger(__name__)

# Redis configuration (optional, falls back to in-memory if Redis not available)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")


def get_redis_client():
    """Get Redis client if available, otherwise return None for in-memory storage."""
    try:
        client = redis.Redis.from_url(
            REDIS_URL, decode_responses=True, socket_connect_timeout=1
        )
        client.ping()  # Test connection
        logger.info("Connected to Redis for rate limiting")
        return client
    except (
        redis.ConnectionError,
        redis.ResponseError,
        redis.TimeoutError,
        ConnectionError,
    ) as e:
        logger.warning(
            f"Redis not available for rate limiting, using in-memory storage: {e}"
        )
        return None


# Initialize rate limiter
try:
    redis_client = get_redis_client()

    if redis_client:
        # Use Redis for distributed rate limiting
        limiter = Limiter(
            key_func=get_remote_address,
            storage_uri=REDIS_URL,
            default_limits=["1000 per hour"],
        )
        logger.info("Rate limiter initialized with Redis backend")
    else:
        # Use in-memory storage for single instance
        limiter = Limiter(key_func=get_remote_address, default_limits=["1000 per hour"])
        logger.info("Rate limiter initialized with in-memory storage")

except Exception as e:
    logger.error(f"Failed to initialize rate limiter: {e}")
    # Fallback limiter
    limiter = Limiter(key_func=get_remote_address, default_limits=["1000 per hour"])
    logger.info("Rate limiter initialized with fallback configuration")


def get_user_id_from_request(request: Request) -> str:
    """Get user ID from request for user-based rate limiting."""
    # Try to get user from request state (set by auth middleware)
    if hasattr(request.state, "user") and request.state.user:
        return f"user:{request.state.user.id}"

    # Fall back to IP address
    return get_remote_address(request)


def get_user_limiter_key(request: Request) -> str:
    """Get rate limiter key based on user authentication status."""
    return get_user_id_from_request(request)


# Custom rate limit exceeded handler
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded."""
    try:
        from app.core.monitoring import log_security_event

        # Log security event
        user_id = None
        if hasattr(request.state, "user") and request.state.user:
            user_id = str(request.state.user.id)

        log_security_event(
            event_type="rate_limit_exceeded",
            user_id=user_id,
            details={
                "path": request.url.path,
                "method": request.method,
                "client_ip": get_remote_address(request),
                "limit": str(exc.detail),
            },
        )
    except Exception as e:
        logger.error(f"Error logging security event: {e}")

    raise HTTPException(
        status_code=429,
        detail={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please try again later.",
            "retry_after": getattr(exc, "retry_after", 60),
        },
    )


# Alias for backward compatibility
rate_limit_handler = rate_limit_exceeded_handler


# Rate limiting configurations for different endpoint types
class RateLimits:
    """Rate limit configurations for different endpoint types."""

    # Authentication endpoints (more restrictive)
    AUTH_LOGIN = "5 per minute"  # Max 5 login attempts per minute
    AUTH_REGISTER = "3 per minute"  # Max 3 registrations per minute
    AUTH_REFRESH = "10 per minute"  # Max 10 token refreshes per minute

    # General API endpoints
    API_GENERAL = "100 per minute"  # General API calls
    API_USER_PROFILE = "30 per minute"  # User profile operations

    # Admin endpoints
    ADMIN_OPERATIONS = "50 per minute"  # Admin operations

    # Health and monitoring
    HEALTH_CHECK = "60 per minute"  # Health checks
    METRICS = "10 per minute"  # Metrics access (more limited)


# Decorator for custom rate limiting
def custom_rate_limit(rate: str, key_func=None):
    """Custom rate limiting decorator."""

    def decorator(func):
        if key_func:
            return limiter.limit(rate, key_func=key_func)(func)
        else:
            return limiter.limit(rate)(func)

    return decorator


# User-based rate limiting for authenticated endpoints
def user_rate_limit(rate: str):
    """Rate limiting based on user ID (if authenticated) or IP address."""
    return custom_rate_limit(rate, key_func=get_user_limiter_key)
