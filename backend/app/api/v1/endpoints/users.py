"""
User management endpoints.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import User, UserUpdate, PasswordChangeRequest
from app.services.user_service import UserService
from app.api.deps import get_current_active_user, get_current_admin_user
from app.core.custom_rate_limiting import rate_limit, CustomRateLimits
from app.core.monitoring import logger

router = APIRouter()


@router.get("/me", response_model=User)
@rate_limit(CustomRateLimits.API_GENERAL)
def get_current_user_profile(
    request: Request,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get current user profile."""
    return current_user


@router.put("/me", response_model=User)
@rate_limit(CustomRateLimits.API_GENERAL)
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


@router.post("/me/change-password")
@rate_limit(CustomRateLimits.API_GENERAL)
def change_password(
    request: Request,
    password_change: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Change current user's password."""
    try:
        logger.info(
            "Password change attempt",
            user_id=current_user.id,
            email=current_user.email,
        )
        success = UserService.change_password(
            db, current_user.id, password_change.current_password, password_change.new_password
        )
        if not success:
            logger.warning("Password change failed - incorrect current password", user_id=current_user.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        logger.info("Password changed successfully", user_id=current_user.id)
        return {"message": "Password changed successfully"}
    except ValueError as e:
        logger.warning(
            "Password change failed - validation error", user_id=current_user.id, error=str(e)
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=List[User])
@rate_limit(CustomRateLimits.ADMIN_OPERATIONS)
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
        # Prevent admin from removing their own admin status
        if (user_id == current_user.id and 
            user_update.is_admin is False):
            logger.warning(
                "Admin attempted to remove own admin status",
                admin_user_id=current_user.id,
                target_user_id=user_id
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove admin status from your own account"
            )
        
        # Also check if trying to remove admin role via roles field
        if (user_id == current_user.id and 
            user_update.roles is not None and 
            "admin" not in [role.value if hasattr(role, 'value') else role for role in user_update.roles]):
            logger.warning(
                "Admin attempted to remove own admin role",
                admin_user_id=current_user.id,
                target_user_id=user_id
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove admin role from your own account"
            )
        
        updated_user = UserService.update(db, user_id, user_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        logger.info(
            "User updated by admin",
            admin_user_id=current_user.id,
            target_user_id=user_id
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
