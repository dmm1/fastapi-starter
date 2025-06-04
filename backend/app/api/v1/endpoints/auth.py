"""
Authentication endpoints.
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import Token, LoginRequest, RefreshTokenRequest, UserCreate, User
from app.services.user_service import UserService
from app.core.security import create_tokens, verify_token
from app.api.deps import get_current_active_user, active_refresh_tokens
from app.core.rate_limiting import limiter, RateLimits
from app.core.monitoring import logger

router = APIRouter()


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
@limiter.limit(RateLimits.AUTH_REGISTER)
def register(
    request: Request, user_create: UserCreate, db: Session = Depends(get_db)
) -> Any:
    """Register a new user."""
    try:
        logger.info("User registration attempt", email=user_create.email)
        user = UserService.create(db, user_create)
        logger.info("User registered successfully", user_id=user.id, email=user.email)
        return user
    except ValueError as e:
        logger.warning(
            "User registration failed", email=user_create.email, error=str(e)
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=Token)
@limiter.limit(RateLimits.AUTH_LOGIN)
def login_json(
    request: Request, login_request: LoginRequest, db: Session = Depends(get_db)
) -> Any:
    """Login with JSON payload."""
    logger.info("Login attempt", email=login_request.email)
    user = UserService.authenticate(db, login_request.email, login_request.password)
    if not user:
        logger.warning("Login failed - invalid credentials", email=login_request.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tokens = create_tokens(user.id, user.email)
    active_refresh_tokens.add(tokens["refresh_token"])
    logger.info("User logged in successfully", user_id=user.id, email=user.email)
    return tokens


@router.post("/login-form", response_model=Token)
@limiter.limit(RateLimits.AUTH_LOGIN)
def login_form(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Any:
    """Login with form data (OAuth2 compatible)."""
    logger.info("Form login attempt", username=form_data.username)
    user = UserService.authenticate(db, form_data.username, form_data.password)
    if not user:
        logger.warning(
            "Form login failed - invalid credentials", username=form_data.username
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tokens = create_tokens(user.id, user.email)
    active_refresh_tokens.add(tokens["refresh_token"])
    logger.info(
        "User logged in successfully via form", user_id=user.id, email=user.email
    )
    return tokens


@router.post("/refresh", response_model=Token)
@limiter.limit(RateLimits.AUTH_REFRESH)
def refresh_token(
    request: Request,
    refresh_request: RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> Any:
    """Refresh access token."""
    if refresh_request.refresh_token not in active_refresh_tokens:
        logger.warning("Invalid refresh token used")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    # Verify refresh token
    payload = verify_token(refresh_request.refresh_token, token_type="refresh")
    if payload is None:
        active_refresh_tokens.discard(refresh_request.refresh_token)
        logger.warning("Expired refresh token used")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Get user ID from token
    user_id = payload.get("sub")
    if user_id is None:
        logger.error("Invalid token payload in refresh token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    # Get user from database
    user = UserService.get_by_id(db, user_id=int(user_id))
    if user is None:
        active_refresh_tokens.discard(refresh_request.refresh_token)
        logger.warning("User not found for refresh token", user_id=user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    # Remove old refresh token and create new tokens
    active_refresh_tokens.discard(refresh_request.refresh_token)
    tokens = create_tokens(user.id, user.email)
    active_refresh_tokens.add(tokens["refresh_token"])

    logger.info("Token refreshed successfully", user_id=user.id, email=user.email)
    return tokens


@router.post("/logout")
@limiter.limit(RateLimits.API_GENERAL)
def logout(
    request: Request,
    refresh_request: RefreshTokenRequest,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Logout user."""
    active_refresh_tokens.discard(refresh_request.refresh_token)
    logger.info("User logged out", user_id=current_user.id, email=current_user.email)
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=User)
@limiter.limit(RateLimits.API_GENERAL)
def get_current_user_info(
    request: Request, current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get current user information."""
    return current_user
