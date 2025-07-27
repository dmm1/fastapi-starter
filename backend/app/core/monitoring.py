"""
Monitoring and observability utilities for the FastAPI application.
"""

import time
import psutil
import structlog
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict, deque

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


class MetricsCollector:
    """Collect and store application metrics."""

    def __init__(self):
        self.request_count = defaultdict(int)
        self.request_times = defaultdict(list)
        self.error_count = defaultdict(int)
        self.status_codes = defaultdict(int)
        self.active_connections = 0
        self.start_time = datetime.now()
        self.endpoint_stats = defaultdict(
            lambda: {"count": 0, "total_time": 0.0, "errors": 0, "avg_time": 0.0}
        )

        # Store recent requests (last 1000)
        self.recent_requests = deque(maxlen=1000)

    def record_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration: float,
        user_id: Optional[str] = None,
    ):
        """Record a request with its metrics."""
        endpoint = f"{method} {path}"

        # Basic counters
        self.request_count[endpoint] += 1
        self.status_codes[status_code] += 1

        # Timing
        self.request_times[endpoint].append(duration)
        if len(self.request_times[endpoint]) > 100:  # Keep only last 100
            self.request_times[endpoint].pop(0)

        # Endpoint stats
        stats = self.endpoint_stats[endpoint]
        stats["count"] += 1
        stats["total_time"] += duration
        stats["avg_time"] = stats["total_time"] / stats["count"]

        if status_code >= 400:
            self.error_count[endpoint] += 1
            stats["errors"] += 1

        # Store recent request
        self.recent_requests.append(
            {
                "timestamp": datetime.now().isoformat(),
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration": duration,
                "user_id": user_id,
            }
        )

    def get_metrics(self) -> Dict[str, Any]:
        """Get all collected metrics."""
        uptime = datetime.now() - self.start_time

        # System metrics
        system_metrics = {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage("/").percent,
        }

        # Calculate average response times
        avg_response_times = {}
        for endpoint, times in self.request_times.items():
            if times:
                avg_response_times[endpoint] = sum(times) / len(times)

        return {
            "uptime_seconds": uptime.total_seconds(),
            "total_requests": sum(self.request_count.values()),
            "requests_by_endpoint": dict(self.request_count),
            "errors_by_endpoint": dict(self.error_count),
            "status_codes": dict(self.status_codes),
            "average_response_times": avg_response_times,
            "endpoint_stats": dict(self.endpoint_stats),
            "active_connections": self.active_connections,
            "system": system_metrics,
            "recent_requests": list(self.recent_requests)[-10:],  # Last 10 requests
        }

    def get_health_status(self) -> Dict[str, Any]:
        """Get health status of the application."""
        metrics = self.get_metrics()

        # Determine health status
        health_status = "healthy"
        issues = []

        # Check system resources
        if metrics["system"]["cpu_percent"] > 90:
            health_status = "degraded"
            issues.append("High CPU usage")

        if metrics["system"]["memory_percent"] > 90:
            health_status = "degraded"
            issues.append("High memory usage")

        # Check error rates
        total_requests = metrics["total_requests"]
        total_errors = sum(self.error_count.values())

        if total_requests > 0:
            error_rate = (total_errors / total_requests) * 100
            if error_rate > 10:  # More than 10% error rate
                health_status = "unhealthy"
                issues.append(f"High error rate: {error_rate:.1f}%")
            elif error_rate > 5:  # More than 5% error rate
                health_status = "degraded"
                issues.append(f"Elevated error rate: {error_rate:.1f}%")

        return {
            "status": health_status,
            "timestamp": datetime.now().isoformat(),
            "uptime_seconds": metrics["uptime_seconds"],
            "issues": issues,
            "metrics": {
                "total_requests": total_requests,
                "error_rate": (
                    (total_errors / total_requests * 100) if total_requests > 0 else 0
                ),
                "cpu_percent": metrics["system"]["cpu_percent"],
                "memory_percent": metrics["system"]["memory_percent"],
            },
        }


# Global metrics collector instance
metrics_collector = MetricsCollector()


class MonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware to collect request metrics and logging."""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Get user info if available
        user_id = None
        if hasattr(request.state, "user"):
            user_id = str(request.state.user.id)

        # Increment active connections
        metrics_collector.active_connections += 1

        try:
            # Process request
            response = await call_next(request)

            # Calculate duration
            duration = time.time() - start_time

            # Record metrics
            metrics_collector.record_request(
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration=duration,
                user_id=user_id,
            )

            # Log request
            logger.info(
                "Request completed",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration=duration,
                user_id=user_id,
                client_ip=request.client.host if request.client else None,
            )

            # Add response headers for monitoring
            response.headers["X-Response-Time"] = str(duration)

            return response

        except Exception as e:
            # Calculate duration even for errors
            duration = time.time() - start_time

            # Record error metrics
            metrics_collector.record_request(
                method=request.method,
                path=request.url.path,
                status_code=500,
                duration=duration,
                user_id=user_id,
            )

            # Log error
            logger.error(
                "Request failed",
                method=request.method,
                path=request.url.path,
                duration=duration,
                user_id=user_id,
                error=str(e),
                client_ip=request.client.host if request.client else None,
            )

            raise

        finally:
            # Decrement active connections
            metrics_collector.active_connections -= 1


def log_security_event(
    event_type: str,
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
):
    """Log security-related events."""
    logger.warning(
        "Security event",
        event_type=event_type,
        user_id=user_id,
        details=details or {},
        timestamp=datetime.now().isoformat(),
    )


def log_auth_attempt(email: str, success: bool, client_ip: Optional[str] = None):
    """Log authentication attempts."""
    logger.info(
        "Authentication attempt",
        email=email,
        success=success,
        client_ip=client_ip,
        timestamp=datetime.now().isoformat(),
    )
