"""
API dependencies for authentication and authorization with RBAC.
"""

from typing import List
from functools import wraps
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_token
from app.services.user_service import UserService
from app.models.user import User
from app.models.role import RoleType

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# Store active refresh tokens (in production, use Redis or database)
active_refresh_tokens = set()


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Verify token
    payload = verify_token(token, token_type="access")
    if payload is None:
        raise credentials_exception

    # Get user ID from token
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Get user from database
    user = UserService.get_by_id(db, user_id=int(user_id))
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Get the current admin user (backward compatibility)."""
    if not current_user.is_admin and not current_user.has_role(RoleType.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


def require_roles(required_roles: List[str]):
    """Dependency factory for role-based access control."""
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_roles = current_user.get_role_names()
        
        # Check if user has any of the required roles
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(required_roles)}",
            )
        return current_user
    
    return role_checker


def require_admin():
    """Shortcut dependency for admin access."""
    return require_roles([RoleType.ADMIN])


def require_moderator():
    """Shortcut dependency for moderator or admin access."""
    return require_roles([RoleType.ADMIN, RoleType.MODERATOR])


def require_user():
    """Shortcut dependency for basic user access."""
    return require_roles([RoleType.USER, RoleType.ADMIN, RoleType.MODERATOR])


# Token introspection dependency
async def get_token_payload(
    token: str = Depends(oauth2_scheme)
) -> dict:
    """Get token payload without database lookup."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token, token_type="access")
    if payload is None:
        raise credentials_exception

    return payload
