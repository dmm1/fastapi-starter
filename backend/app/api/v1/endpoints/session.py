from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session as DBSession
from app.db.session import get_db
from app.services.session_service import SessionService
from app.schemas.session import SessionOut
from app.models.session import Session as SessionModel
from app.api.deps import get_current_active_user

router = APIRouter()


@router.get("/", response_model=list[SessionOut])
async def list_sessions(
    request: Request,
    db: DBSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """List active sessions for the current user."""
    current_session_token = request.cookies.get("session_token")

    # Debug logging
    print(f"DEBUG: User {current_user.id} requesting sessions")
    print(f"DEBUG: Session cookie present: {bool(current_session_token)}")
    print(f"DEBUG: All cookies: {dict(request.cookies)}")
    if current_session_token:
        print(f"DEBUG: Session token preview: {current_session_token[:16]}...")

    sessions = SessionService.get_sessions(db, current_user.id, current_session_token)

    print(f"DEBUG: Found {len(sessions)} sessions")
    for i, session in enumerate(sessions):
        is_current = getattr(session, "is_current", False)
        token_preview = (
            getattr(session, "token", "")[:16] + "..."
            if getattr(session, "token", "")
            else "No token"
        )
        print(
            f"DEBUG: Session {i+1}: ID={session.id}, Current={is_current}, Token={token_preview}"
        )

    return sessions


@router.delete("/{session_id}")
async def delete_session(
    session_id: int,
    request: Request,
    response: Response,
    db: DBSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Delete a session (logout from device)."""
    current_session_token = request.cookies.get("session_token")

    # Check if user is trying to delete their current session
    session_to_delete = (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id, SessionModel.user_id == current_user.id)
        .first()
    )

    is_current_session = (
        session_to_delete
        and getattr(session_to_delete, "token") == current_session_token
    )

    # Delete the session
    success = SessionService.delete_session(db, session_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")

    # If this was the current session, clear the cookie and indicate logout needed
    if is_current_session:
        response.delete_cookie("session_token", path="/")
        return {
            "success": True,
            "current_session_deleted": True,
            "message": "Current session deleted. Please login again.",
        }

    return {"success": True, "current_session_deleted": False}


@router.delete("/")
async def delete_all_other_sessions(
    request: Request,
    db: DBSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Delete all sessions except the current one (logout from all other devices)."""
    current_session_token = request.cookies.get("session_token")

    print(f"DEBUG: Deleting other sessions for user {current_user.id}")
    print(f"DEBUG: Session cookie present: {bool(current_session_token)}")
    if current_session_token:
        print(f"DEBUG: Current session token: {current_session_token[:16]}...")

    if current_session_token:
        # If we have a session cookie, exclude the current session
        print("DEBUG: Using exclude current session logic")
        deleted_count = SessionService.delete_all_sessions_except_current(
            db, current_user.id, current_session_token
        )
    else:
        # If no session cookie, just delete all sessions for this user
        # This happens when user is authenticated via JWT only
        print("DEBUG: Using delete all sessions logic (no session cookie)")
        deleted_count = SessionService.delete_all_user_sessions(db, current_user.id)

    print(f"DEBUG: Deleted {deleted_count} sessions")
    return {"success": True, "deleted_count": deleted_count}
