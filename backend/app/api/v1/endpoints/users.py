"""
User management endpoints.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import User, UserUpdate
from app.services.user_service import UserService
from app.api.deps import get_current_active_user, get_current_admin_user
from app.core.rate_limiting import limiter, RateLimits
from app.core.monitoring import logger

router = APIRouter()


@router.get("/me", response_model=User)
@limiter.limit(RateLimits.API_GENERAL)
def get_current_user_profile(
    request: Request,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get current user profile."""
    return current_user


@router.put("/me", response_model=User)
@limiter.limit(RateLimits.API_GENERAL)
def update_current_user_profile(
    request: Request,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Update current user profile."""
    try:
        logger.info(
            "User profile update attempt",
            user_id=current_user.id,
            email=current_user.email,
        )
        updated_user = UserService.update(db, current_user.id, user_update)
        if not updated_user:
            logger.error("User not found during update", user_id=current_user.id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        logger.info("User profile updated successfully", user_id=current_user.id)
        return updated_user
    except ValueError as e:
        logger.warning(
            "User profile update failed", user_id=current_user.id, error=str(e)
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=List[User])
@limiter.limit(RateLimits.ADMIN_OPERATIONS)
def get_all_users(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get all users (admin only)."""
    logger.info(
        "Admin retrieving all users",
        admin_user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    users = UserService.get_all(db, skip=skip, limit=limit)
    return users


@router.get("/{user_id}", response_model=User)
def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get user by ID (admin only)."""
    user = UserService.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


@router.put("/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """Update user by ID (admin only)."""
    try:
        updated_user = UserService.update(db, user_id, user_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return updated_user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """Delete user by ID (admin only)."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    success = UserService.delete(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return {"message": "User deleted successfully"}
