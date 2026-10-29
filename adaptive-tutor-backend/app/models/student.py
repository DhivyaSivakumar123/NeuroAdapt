"""
Student model.

`profile_id` is nullable: a parent may create a student profile on behalf of a child
who is too young to have their own auth account.
`parent_id` references profiles(id) — the parent/guardian who manages this student.
`learner_profile_tags` stores traits like ['adhd', 'autism'] as a text array.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, SQLModel


class Student(SQLModel, table=True):
    __tablename__ = "students"

    id: uuid.UUID = Field(
        sa_column=sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    )
    profile_id: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=sa.Column(
            sa.UUID(as_uuid=True),
            sa.ForeignKey("profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    name: str = Field(nullable=False, max_length=255)
    age: int = Field(nullable=False, ge=1, le=120)
    grade_level: str = Field(nullable=False, max_length=50)
    learner_profile_tags: list[str] = Field(
        default_factory=list,
        sa_column=sa.Column(
            sa.JSON().with_variant(ARRAY(sa.Text), "postgresql"),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )
    parent_id: uuid.UUID = Field(
        sa_column=sa.Column(
            sa.UUID(as_uuid=True),
            sa.ForeignKey("profiles.id", ondelete="RESTRICT"),
            nullable=False,
        )
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=sa.Column(
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
