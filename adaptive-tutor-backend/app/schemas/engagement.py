"""Engagement schemas — DTOs for the engagement debug view."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class EngagementScoreResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    task_id: uuid.UUID
    computed_score: float
    computed_at: datetime
    signals_snapshot: dict[str, Any]
    classification: str  # derived from computed_score, not stored in DB

    model_config = {"from_attributes": True}


class SessionEngagementResponse(BaseModel):
    session_id: uuid.UUID
    scores: list[EngagementScoreResponse]
    latest_classification: str | None  # most recent score's classification
