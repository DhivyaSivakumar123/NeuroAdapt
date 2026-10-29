"""
Event schemas — discriminated Pydantic union for the POST /events endpoint.

Each event_type has a specific, validated payload shape. This enforces data
minimization (Section 9 of the spec): only the fields defined per event type
are accepted — no free-form extra keys.

The discriminated union is keyed on `event_type`, so Pydantic can select the
correct payload validator at parse time without trying all alternatives.
"""

import uuid
from datetime import datetime
from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field


# ── Per-event payload models ──────────────────────────────────────────────────

class TaskStartPayload(BaseModel):
    event_type: Literal["task_start"]
    # No extra fields needed — the fact the event happened is the signal.


class TaskSwitchAwayPayload(BaseModel):
    event_type: Literal["task_switch_away"]
    # No extra fields — counted to compute switch_rate.


class TaskSwitchBackPayload(BaseModel):
    event_type: Literal["task_switch_back"]
    # No extra fields.


class AnswerSubmitPayload(BaseModel):
    event_type: Literal["answer_submit"]
    correct: bool
    answer_given: str = Field(..., max_length=2000)


class RetryPayload(BaseModel):
    event_type: Literal["retry"]
    attempt_number: int = Field(..., ge=1)


class IdlePingPayload(BaseModel):
    event_type: Literal["idle_ping"]
    idle_seconds: int = Field(..., ge=1)


class SelfReportPayload(BaseModel):
    event_type: Literal["self_report"]
    score: int = Field(..., ge=1, le=5)  # 1 = very hard/bad, 5 = easy/great


class TaskCompletePayload(BaseModel):
    event_type: Literal["task_complete"]
    correct: bool
    actual_duration_seconds: int = Field(..., ge=0)


class TaskAbandonPayload(BaseModel):
    event_type: Literal["task_abandon"]
    reason: str | None = Field(default=None, max_length=500)


# Discriminated union — Pydantic selects the right model based on event_type.
EventPayload = Annotated[
    Union[
        TaskStartPayload,
        TaskSwitchAwayPayload,
        TaskSwitchBackPayload,
        AnswerSubmitPayload,
        RetryPayload,
        IdlePingPayload,
        SelfReportPayload,
        TaskCompletePayload,
        TaskAbandonPayload,
    ],
    Field(discriminator="event_type"),
]


# ── Top-level request body ────────────────────────────────────────────────────

class EventCreate(BaseModel):
    """
    Request body for POST /events.
    `payload` is a discriminated union — shape is determined by `event_type`.
    """

    session_id: uuid.UUID
    task_id: uuid.UUID
    payload: EventPayload
    # Optionally override timestamp (e.g., client-side timestamp for more accuracy).
    # Defaults to server time if omitted.
    timestamp: datetime | None = None


class EventResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    task_id: uuid.UUID
    event_type: str
    timestamp: datetime

    model_config = {"from_attributes": True}
