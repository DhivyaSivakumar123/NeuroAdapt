"""Intervention schemas — request/response DTOs."""

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

from app.models.intervention import InterventionOutcome, InterventionType


class InterventionResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    task_id: uuid.UUID
    intervention_type: InterventionType
    triggered_at: datetime
    outcome: InterventionOutcome | None
    generated_content_id: uuid.UUID | None
    generation_source: Literal["llm", "stub"] = "llm"

    model_config = {"from_attributes": True}


class OutcomeUpdate(BaseModel):
    """Request body for PATCH /interventions/{id}/outcome."""

    outcome: InterventionOutcome


class SimulateInterventionRequest(BaseModel):
    """
    Request body for POST /interventions/simulate (dev/test only).
    Allows forcing a specific signal snapshot without manufacturing real events.
    """

    session_id: uuid.UUID
    task_id: uuid.UUID
    signals: dict[str, Any]
    # Optional: force a specific intervention type instead of auto-selecting.
    force_type: InterventionType | None = None
