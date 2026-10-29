"""
InteractionEvent model — the raw event log.

This table is the most valuable asset in the system (per spec Section 6).
Every user action during a session is logged here as the raw material for:
  - Engagement scoring (Block 4)
  - Future ML model training (post-pilot)
  - Debugging/retuning

`event_type` enum values (exact, per day-01-backend-plan.md Section 1.2):
  task_start, task_switch_away, task_switch_back, answer_submit,
  retry, idle_ping, self_report, task_complete, task_abandon

`payload` is JSONB with shape determined by event_type (enforced at API layer
via discriminated Pydantic union in schemas/event.py — not at DB level).
Examples:
  - answer_submit: {"correct": bool, "answer_given": str}
  - self_report:   {"score": int}  # 1–5 scale
  - idle_ping:     {"idle_seconds": int}
  - retry:         {"attempt_number": int}
"""

import enum
import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class EventType(str, enum.Enum):
    """Exact 9 event type values — do not rename (breaking change for logged data)."""

    task_start = "task_start"
    task_switch_away = "task_switch_away"
    task_switch_back = "task_switch_back"
    answer_submit = "answer_submit"
    retry = "retry"
    idle_ping = "idle_ping"
    self_report = "self_report"
    task_complete = "task_complete"
    task_abandon = "task_abandon"


# Event types that trigger engagement scoring when logged.
SCORING_EVENT_TYPES: frozenset[EventType] = frozenset(
    [
        EventType.task_complete,
        EventType.task_abandon,
        EventType.retry,
        EventType.idle_ping,
        EventType.self_report,
    ]
)


class InteractionEvent(SQLModel, table=True):
    __tablename__ = "interaction_events"

    id: uuid.UUID = Field(
        sa_column=sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    )
    session_id: uuid.UUID = Field(
        sa_column=sa.Column(
            sa.UUID(as_uuid=True),
            sa.ForeignKey("sessions.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    task_id: uuid.UUID = Field(
        sa_column=sa.Column(
            sa.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        )
    )
    event_type: EventType = Field(
        sa_column=sa.Column(
            sa.Enum(EventType, name="event_type", create_type=True),
            nullable=False,
        )
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=sa.Column(
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
            index=True,
        ),
    )
    payload: dict = Field(
        default_factory=dict,
        sa_column=sa.Column(sa.JSON().with_variant(JSONB, "postgresql"), nullable=False),
    )
