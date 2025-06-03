"""
Authentication endpoints.
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import Token, LoginRequest, RefreshTokenRequest, UserCreate, User
from app.services.user_service import UserService
from app.core.security import create_tokens, verify_token
from app.api.deps import get_current_active_user, active_refresh_tokens

router = APIRouter()


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
def register(user_create: UserCreate, db: Session = Depends(get_db)) -> Any:
    """Register a new user."""
    try:
        user = UserService.create(db, user_create)
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=Token)
def login_json(login_request: LoginRequest, db: Session = Depends(get_db)) -> Any:
    """Login with JSON payload."""
    user = UserService.authenticate(db, login_request.email, login_request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tokens = create_tokens(user.id, user.email)
    active_refresh_tokens.add(tokens["refresh_token"])
    return tokens


@router.post("/login-form", response_model=Token)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> Any:
    """Login with form data (OAuth2 compatible)."""
    user = UserService.authenticate(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tokens = create_tokens(user.id, user.email)
    active_refresh_tokens.add(tokens["refresh_token"])
    return tokens


@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_request: RefreshTokenRequest, db: Session = Depends(get_db)
) -> Any:
    """Refresh access token."""
    if refresh_request.refresh_token not in active_refresh_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    # Verify refresh token
    payload = verify_token(refresh_request.refresh_token, token_type="refresh")
    if payload is None:
        active_refresh_tokens.discard(refresh_request.refresh_token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Get user ID from token
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    # Get user from database
    user = UserService.get_by_id(db, user_id=int(user_id))
    if user is None:
        active_refresh_tokens.discard(refresh_request.refresh_token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    # Remove old refresh token and create new tokens
    active_refresh_tokens.discard(refresh_request.refresh_token)
    tokens = create_tokens(user.id, user.email)
    active_refresh_tokens.add(tokens["refresh_token"])

    return tokens


@router.post("/logout")
def logout(
    refresh_request: RefreshTokenRequest,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Logout user."""
    active_refresh_tokens.discard(refresh_request.refresh_token)
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=User)
def get_current_user_info(current_user: User = Depends(get_current_active_user)) -> Any:
    """Get current user information."""
    return current_user
