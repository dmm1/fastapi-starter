"""
Custom rate limiting implementation without SlowAPI dependency.
"""

import time
import asyncio
from typing import Dict, Optional, Callable
from collections import defaultdict, deque
from fastapi import Request, HTTPException
from functools import wraps
import logging

logger = logging.getLogger(__name__)


def get_rate_limits():
    """Get rate limits from settings, with fallback to defaults."""
    try:
        from app.core.config import settings

        return {
            "AUTH_LOGIN": settings.auth_login_rate_limit,
            "AUTH_REGISTER": settings.auth_register_rate_limit,
            "AUTH_REFRESH": settings.auth_refresh_rate_limit,
            "API_GENERAL": settings.api_general_rate_limit,
            "API_USER_PROFILE": settings.api_user_profile_rate_limit,
            "ADMIN_OPERATIONS": settings.admin_operations_rate_limit,
            "HEALTH_CHECK": settings.health_check_rate_limit,
            "METRICS": settings.metrics_rate_limit,
        }
    except ImportError:
        # Fallback to defaults if settings not available
        return {
            "AUTH_LOGIN": "5 per minute",
            "AUTH_REGISTER": "3 per minute",
            "AUTH_REFRESH": "10 per minute",
            "API_GENERAL": "100 per minute",
            "API_USER_PROFILE": "30 per minute",
            "ADMIN_OPERATIONS": "50 per minute",
            "HEALTH_CHECK": "60 per minute",
            "METRICS": "10 per minute",
        }


class RateLimiter:
    """Custom rate limiter with in-memory storage."""

    def __init__(self):
        self.requests: Dict[str, deque] = defaultdict(deque)
        self.lock = asyncio.Lock()

    async def is_allowed(
        self, key: str, limit: int, window_seconds: int
    ) -> tuple[bool, float]:
        """Check if request is allowed under rate limit."""
        async with self.lock:
            now = time.time()
            window_start = now - window_seconds

            # Clean old requests outside the window
            request_times = self.requests[key]
            while request_times and request_times[0] < window_start:
                request_times.popleft()

            # Check if limit is exceeded
            if len(request_times) >= limit:
                # Calculate retry_after based on oldest request in window
                oldest_request = request_times[0]
                retry_after = (oldest_request + window_seconds) - now
                return False, max(0, retry_after)

            # Add current request
            request_times.append(now)
            return True, 0

    async def cleanup_old_entries(self):
        """Cleanup old entries to prevent memory leaks."""
        async with self.lock:
            now = time.time()
            keys_to_remove = []

            for key, request_times in self.requests.items():
                # Remove entries older than 1 hour
                while request_times and request_times[0] < now - 3600:
                    request_times.popleft()

                # Remove empty entries
                if not request_times:
                    keys_to_remove.append(key)

            for key in keys_to_remove:
                del self.requests[key]


# Global rate limiter instance
rate_limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    # Check for forwarded headers first
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fall back to direct connection
    if request.client and hasattr(request.client, "host"):
        return request.client.host

    return "unknown"


def get_user_identifier(request: Request) -> str:
    """Get user identifier for rate limiting."""
    # Try to get user from request state (set by auth middleware)
    if hasattr(request.state, "user") and request.state.user:
        return f"user:{request.state.user.id}"

    # Fall back to IP address
    return f"ip:{get_client_ip(request)}"


def parse_rate_limit(rate_string: str) -> tuple[int, int]:
    """Parse rate limit string like '5 per minute' to (limit, window_seconds)."""
    parts = rate_string.lower().split()
    if len(parts) < 3 or parts[1] != "per":
        raise ValueError(f"Invalid rate limit format: {rate_string}")

    limit = int(parts[0])
    time_unit = parts[2]

    time_multipliers = {
        "second": 1,
        "seconds": 1,
        "minute": 60,
        "minutes": 60,
        "hour": 3600,
        "hours": 3600,
        "day": 86400,
        "days": 86400,
    }

    if time_unit not in time_multipliers:
        raise ValueError(f"Unknown time unit: {time_unit}")

    window_seconds = time_multipliers[time_unit]
    return limit, window_seconds


class CustomRateLimitMiddleware:
    """Custom rate limiting middleware."""

    def __init__(self, app, default_rate: str = "1000 per hour"):
        self.app = app
        self.default_limit, self.default_window = parse_rate_limit(default_rate)

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Skip rate limiting for health checks and static files
        path = scope.get("path", "")
        if path in ["/health", "/favicon.ico", "/metrics"]:
            await self.app(scope, receive, send)
            return

        # Create request object to get client info
        from fastapi import Request

        request = Request(scope, receive)

        identifier = get_user_identifier(request)
        allowed, retry_after = await rate_limiter.is_allowed(
            identifier, self.default_limit, self.default_window
        )

        if not allowed:
            # Log rate limit exceeded
            logger.warning(
                f"Rate limit exceeded for {identifier} on {path}",
                extra={
                    "event_type": "rate_limit_exceeded",
                    "identifier": identifier,
                    "path": path,
                    "retry_after": retry_after,
                },
            )

            # Send rate limit exceeded response
            response = {
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again later.",
                "retry_after": int(retry_after) + 1,
            }

            await send(
                {
                    "type": "http.response.start",
                    "status": 429,
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"retry-after", str(int(retry_after) + 1).encode()),
                    ],
                }
            )

            import json

            await send(
                {
                    "type": "http.response.body",
                    "body": json.dumps(response).encode(),
                }
            )
            return

        await self.app(scope, receive, send)


def rate_limit(rate_string: str, key_func: Optional[Callable] = None):
    """Decorator for custom rate limiting on specific endpoints."""
    limit, window_seconds = parse_rate_limit(rate_string)

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args/kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if request is None:
                # Look in kwargs
                request = kwargs.get("request")

            if request is None:
                # No request found, skip rate limiting
                return (
                    await func(*args, **kwargs)
                    if asyncio.iscoroutinefunction(func)
                    else func(*args, **kwargs)
                )

            # Get identifier
            if key_func:
                identifier = key_func(request)
            else:
                identifier = get_user_identifier(request)

            # Check rate limit
            allowed, retry_after = await rate_limiter.is_allowed(
                f"{identifier}:{func.__name__}", limit, window_seconds
            )

            if not allowed:
                logger.warning(
                    f"Rate limit exceeded for {identifier} on {func.__name__}",
                    extra={
                        "event_type": "rate_limit_exceeded",
                        "identifier": identifier,
                        "endpoint": func.__name__,
                        "retry_after": retry_after,
                    },
                )

                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Rate limit exceeded",
                        "message": "Too many requests. Please try again later.",
                        "retry_after": int(retry_after) + 1,
                    },
                    headers={"Retry-After": str(int(retry_after) + 1)},
                )

            # Call the function
            return (
                await func(*args, **kwargs)
                if asyncio.iscoroutinefunction(func)
                else func(*args, **kwargs)
            )

        return wrapper

    return decorator


# Rate limiting configurations for different endpoint types
class CustomRateLimits:
    """Rate limit configurations for different endpoint types."""

    @staticmethod
    def _get_limits():
        """Get current rate limits from configuration."""
        return get_rate_limits()

    # Static attributes with type annotations for better IDE support
    AUTH_LOGIN: str = ""
    AUTH_REGISTER: str = ""
    AUTH_REFRESH: str = ""
    API_GENERAL: str = ""
    API_USER_PROFILE: str = ""
    ADMIN_OPERATIONS: str = ""
    HEALTH_CHECK: str = ""
    METRICS: str = ""


# Initialize the class attributes with actual values
_limits = get_rate_limits()
CustomRateLimits.AUTH_LOGIN = _limits["AUTH_LOGIN"]
CustomRateLimits.AUTH_REGISTER = _limits["AUTH_REGISTER"]
CustomRateLimits.AUTH_REFRESH = _limits["AUTH_REFRESH"]
CustomRateLimits.API_GENERAL = _limits["API_GENERAL"]
CustomRateLimits.API_USER_PROFILE = _limits["API_USER_PROFILE"]
CustomRateLimits.ADMIN_OPERATIONS = _limits["ADMIN_OPERATIONS"]
CustomRateLimits.HEALTH_CHECK = _limits["HEALTH_CHECK"]
CustomRateLimits.METRICS = _limits["METRICS"]


# Background task to cleanup old entries
async def cleanup_rate_limiter():
    """Background task to cleanup old rate limiter entries."""
    while True:
        try:
            await rate_limiter.cleanup_old_entries()
            await asyncio.sleep(300)  # Cleanup every 5 minutes
        except Exception as e:
            logger.error(f"Error in rate limiter cleanup: {e}")
            await asyncio.sleep(60)  # Wait 1 minute before retry
