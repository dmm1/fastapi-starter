"""
Main FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import create_tables, init_db
from app.core.monitoring import MonitoringMiddleware, metrics_collector, logger
from app.core.rate_limiting import limiter, rate_limit_handler, RateLimits
from slowapi.errors import RateLimitExceeded
from datetime import datetime


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description=settings.description,
        openapi_url="/api/v1/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Set all CORS enabled origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add monitoring middleware
    app.add_middleware(MonitoringMiddleware)

    # Add rate limiter
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

    # Include API router
    app.include_router(api_router, prefix="/api/v1")

    return app


# Create the FastAPI app
app = create_application()


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    logger.info("Starting FastAPI application", version=settings.version)
    create_tables()
    init_db()
    logger.info("Database initialized successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Shutting down FastAPI application")


@app.get("/")
@limiter.limit(RateLimits.API_GENERAL)
async def root(request: Request):
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.version,
        "docs_url": "/docs",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/health")
@limiter.limit(RateLimits.HEALTH_CHECK)
async def health_check(request: Request):
    """Enhanced health check endpoint with detailed system information."""
    health_data = metrics_collector.get_health_status()

    # Add database connectivity check
    try:
        from app.db.session import SessionLocal
        from sqlalchemy import text

        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        health_data["database"] = "healthy"
    except Exception as e:
        health_data["database"] = "unhealthy"
        health_data["database_error"] = str(e)
        if health_data["status"] == "healthy":
            health_data["status"] = "degraded"

    # Return appropriate HTTP status code
    status_code = 200
    if health_data["status"] == "degraded":
        status_code = 200  # Still operational
    elif health_data["status"] == "unhealthy":
        status_code = 503  # Service unavailable

    return JSONResponse(content=health_data, status_code=status_code)


@app.get("/metrics")
@limiter.limit(RateLimits.METRICS)
async def get_metrics(request: Request):
    """Get application metrics (for monitoring systems)."""
    return metrics_collector.get_metrics()


@app.get("/status")
@limiter.limit(RateLimits.API_GENERAL)
async def get_status(request: Request):
    """Get basic application status."""
    return {
        "status": "running",
        "version": settings.version,
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": (
            datetime.utcnow() - metrics_collector.start_time
        ).total_seconds(),
    }


@app.get("/favicon.ico")
async def favicon():
    """Favicon endpoint to prevent 404 errors."""
    # Return a simple 1x1 transparent PNG as favicon
    # This prevents 404 errors in browser console
    transparent_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82"
    return Response(content=transparent_png, media_type="image/png")
