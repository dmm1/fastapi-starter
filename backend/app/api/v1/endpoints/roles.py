"""
Role management endpoints.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import Role, UserRoleUpdate, User
from app.services.role_service import RoleService
from app.services.user_service import UserService
from app.api.deps import require_admin, get_current_active_user
from app.core.custom_rate_limiting import rate_limit, CustomRateLimits
from app.core.monitoring import logger
from app.models.role import RoleType

router = APIRouter()


@router.get("/", response_model=List[Role])
@rate_limit(CustomRateLimits.API_GENERAL)
def get_all_roles(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get all available roles."""
    roles = RoleService.get_all_roles(db)
    return roles


@router.post("/assign", response_model=User)
@rate_limit(CustomRateLimits.API_GENERAL)
def assign_user_roles(
    request: Request,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())
) -> Any:
    """Assign roles to a user (admin only)."""
    try:
        user = UserService.get_by_id(db, role_update.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Clear existing roles and assign new ones
        user.roles.clear()
        for role in role_update.roles:
            RoleService.assign_role_to_user(db, user, role.value)
        
        logger.info(
            "Roles updated for user",
            user_id=user.id,
            roles=[role.value for role in role_update.roles],
            updated_by=current_user.id
        )
        
        return user
        
    except Exception as e:
        logger.error("Failed to update user roles", error=str(e), user_id=role_update.user_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/user/{user_id}", response_model=List[Role])
@rate_limit(CustomRateLimits.API_GENERAL)
def get_user_roles(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get roles for a specific user."""
    # Users can view their own roles, admins can view any user's roles
    if current_user.id != user_id and not current_user.has_role(RoleType.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user's roles"
        )
    
    user = UserService.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user.roles