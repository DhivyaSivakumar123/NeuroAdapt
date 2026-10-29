"""
Intervention model.

One row per triggered intervention.
`outcome` is nullable — set to null when first triggered, updated via
PATCH /interventions/{id}/outcome as the student continues after the intervention.

`generated_content_id` points to a tasks row that was LLM-generated for this
intervention (re_chunk / modality_switch / difficulty_step_down).
It is null for break_task interventions (which serve pre-authored content).
"""

import enum
import uuid
from datetime import datetime, timezone
from typing import Optional

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class InterventionType(str, enum.Enum):
    """Four intervention types from spec Section 4.3."""

    re_chunk = "re_chunk"
    modality_switch = "modality_switch"
    break_task = "break_task"
    difficulty_step_down = "difficulty_step_down"


class InterventionOutcome(str, enum.Enum):
    """Outcome states — set after the student continues following an intervention."""

    completed = "completed"
    abandoned_after = "abandoned_after"
    improved_score = "improved_score"


class Intervention(SQLModel, table=True):
    __tablename__ = "interventions"

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
        )
    )
    intervention_type: InterventionType = Field(
        sa_column=sa.Column(
            sa.Enum(InterventionType, name="intervention_type", create_type=True),
            nullable=False,
        )
    )
    triggered_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=sa.Column(
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    outcome: Optional[InterventionOutcome] = Field(
        default=None,
        sa_column=sa.Column(
            sa.Enum(InterventionOutcome, name="intervention_outcome", create_type=True),
            nullable=True,
        ),
    )
    generated_content_id: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=sa.Column(
            sa.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    generation_source: str = Field(
        default="llm",
        sa_column=sa.Column(
            sa.String,
            nullable=False,
            server_default="llm",
        ),
    )
