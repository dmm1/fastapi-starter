"""
Session schema for API responses.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SessionOut(BaseModel):
    id: int
    user_id: int
    user_agent: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool
    is_current: Optional[bool] = False

    class Config:
        from_attributes = True
