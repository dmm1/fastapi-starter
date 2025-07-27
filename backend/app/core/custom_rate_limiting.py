"""
Custom rate limiting implementation without SlowAPI dependency.
"""

import time
import asyncio
from typing import Dict, Optional, Callable
from collections import defaultdict, deque
from fastapi import Request, HTTPException
from functools import wraps
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """Custom rate limiter with in-memory storage."""
    
    def __init__(self):
        self.requests: Dict[str, deque] = defaultdict(deque)
        self.lock = asyncio.Lock()
    
    async def is_allowed(self, key: str, limit: int, window_seconds: int) -> tuple[bool, float]:
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
    if hasattr(request.client, "host"):
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
                    "retry_after": retry_after
                }
            )
            
            # Send rate limit exceeded response
            response = {
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again later.",
                "retry_after": int(retry_after) + 1,
            }
            
            await send({
                "type": "http.response.start",
                "status": 429,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"retry-after", str(int(retry_after) + 1).encode()),
                ],
            })
            
            import json
            await send({
                "type": "http.response.body",
                "body": json.dumps(response).encode(),
            })
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
                request = kwargs.get('request')
            
            if request is None:
                # No request found, skip rate limiting
                return await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            
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
                        "retry_after": retry_after
                    }
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
            return await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
        
        return wrapper
    return decorator


# Rate limiting configurations for different endpoint types
class CustomRateLimits:
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