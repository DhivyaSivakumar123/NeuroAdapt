"""
Session model — a student's continuous learning session.

Named `Session` (the learning session), not to be confused with SQLAlchemy's
DB session (which is handled in app/db/session.py).
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class Session(SQLModel, table=True):
    __tablename__ = "sessions"

    id: uuid.UUID = Field(
        sa_column=sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    )
    student_id: uuid.UUID = Field(
        sa_column=sa.Column(
            sa.UUID(as_uuid=True),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    started_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=sa.Column(
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    ended_at: Optional[datetime] = Field(
        default=None,
        sa_column=sa.Column(sa.DateTime(timezone=True), nullable=True),
    )
