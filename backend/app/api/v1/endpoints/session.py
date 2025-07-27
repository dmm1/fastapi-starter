from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from app.db.session import get_db
from app.services.session_service import SessionService
from app.schemas.session import SessionOut
from app.api.deps import get_current_active_user

router = APIRouter()


@router.get("/", response_model=list[SessionOut])
async def list_sessions(
    db: DBSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """List active sessions for the current user."""
    return SessionService.get_sessions(db, current_user.id)


@router.delete("/{session_id}")
async def delete_session(
    session_id: int,
    db: DBSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Delete a session (logout from device)."""
    success = SessionService.delete_session(db, session_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True}
