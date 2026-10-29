"""Session schemas — request/response DTOs for the session router."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SessionCreate(BaseModel):
    """Request body for POST /sessions."""

    student_id: uuid.UUID
    subject: Optional[str] = "biology"


class SessionResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    started_at: datetime
    ended_at: Optional[datetime]

    model_config = {"from_attributes": True}
