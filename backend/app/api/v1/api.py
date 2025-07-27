"""
API v1 router configuration.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, roles, session

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles"])
api_router.include_router(session.router, prefix="/sessions", tags=["Sessions"])
