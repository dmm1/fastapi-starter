"""
User management endpoints.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid
from pathlib import Path
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
            db,
            current_user.id,
            password_change.current_password,
            password_change.new_password,
        )
        if not success:
            logger.warning(
                "Password change failed - incorrect current password",
                user_id=current_user.id,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        logger.info("Password changed successfully", user_id=current_user.id)
        return {"message": "Password changed successfully"}
    except ValueError as e:
        logger.warning(
            "Password change failed - validation error",
            user_id=current_user.id,
            error=str(e),
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/me/avatar")
@rate_limit(CustomRateLimits.API_GENERAL)
def upload_avatar(
    request: Request,
    avatar: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Upload user avatar."""
    try:
        # Validate file type
        if not avatar.content_type or not avatar.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image"
            )

        # Validate file size (5MB limit)
        if avatar.size and avatar.size > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 5MB",
            )

        # Create uploads directory if it doesn't exist
        upload_dir = Path("data/uploads/avatars")
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        file_extension = Path(avatar.filename or "").suffix or ".jpg"
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = upload_dir / filename

        # Save file
        with open(file_path, "wb") as buffer:
            content = avatar.file.read()
            buffer.write(content)

        # Create full URL - include the base URL for the frontend
        base_url = str(request.base_url).rstrip("/")
        avatar_url = f"{base_url}/static/avatars/{filename}"

        logger.info(
            "Avatar uploaded successfully", user_id=current_user.id, filename=filename
        )

        return {"avatar_url": avatar_url}

    except Exception as e:
        logger.error("Avatar upload failed", user_id=current_user.id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Avatar upload failed",
        )


@router.delete("/me/avatar")
@rate_limit(CustomRateLimits.API_GENERAL)
def delete_avatar(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Delete user avatar."""
    try:
        # If user has an avatar, try to delete the file
        if current_user.avatar:
            # Handle both relative and absolute URLs
            if "/static/avatars/" in current_user.avatar:
                filename = current_user.avatar.split("/static/avatars/")[-1]
                file_path = Path("data/uploads/avatars") / filename
                if file_path.exists():
                    os.unlink(file_path)
                    logger.info(
                        "Avatar file deleted from filesystem",
                        user_id=current_user.id,
                        filename=filename,
                    )

        # Update user's avatar field to null in database
        user_update = UserUpdate(avatar=None)
        updated_user = UserService.update(db, current_user.id, user_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        logger.info("Avatar deleted successfully", user_id=current_user.id)

        return {"message": "Avatar deleted successfully"}

    except Exception as e:
        logger.error("Avatar deletion failed", user_id=current_user.id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Avatar deletion failed",
        )


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
        if user_id == current_user.id and user_update.is_admin is False:
            logger.warning(
                "Admin attempted to remove own admin status",
                admin_user_id=current_user.id,
                target_user_id=user_id,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove admin status from your own account",
            )

        # Also check if trying to remove admin role via roles field
        if (
            user_id == current_user.id
            and user_update.roles is not None
            and "admin"
            not in [
                role.value if hasattr(role, "value") else role
                for role in user_update.roles
            ]
        ):
            logger.warning(
                "Admin attempted to remove own admin role",
                admin_user_id=current_user.id,
                target_user_id=user_id,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove admin role from your own account",
            )

        updated_user = UserService.update(db, user_id, user_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        logger.info(
            "User updated by admin",
            admin_user_id=current_user.id,
            target_user_id=user_id,
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
