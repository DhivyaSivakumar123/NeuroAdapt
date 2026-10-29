"""
EngagementScore model — one row per scoring computation.

Computed on SCORING_EVENT_TYPES events (task_complete, task_abandon, retry,
idle_ping, self_report). Stores both the final float and the raw signal inputs
so weights/thresholds can be retunned later without losing the derivation.

`signals_snapshot` example:
{
  "normalized_latency_ratio": 0.82,
  "normalized_switch_rate": 0.40,
  "abandonment_flag": 0.0,
  "inverse_self_report_score": 0.5,
  "classification": "flag_monitor"
}
"""

import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class EngagementScore(SQLModel, table=True):
    __tablename__ = "engagement_scores"

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
    computed_score: float = Field(nullable=False)
    computed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=sa.Column(
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    signals_snapshot: dict = Field(
        default_factory=dict,
        sa_column=sa.Column(sa.JSON().with_variant(JSONB, "postgresql"), nullable=False),
    )
