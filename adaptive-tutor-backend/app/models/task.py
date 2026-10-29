"""
Task model.

`content_body` is JSONB — structured differently per content_type:
  - text:        {"question": str, "answer": str, "hints": [str]}
  - interactive: {"question": str, "options": [str], "correct_index": int}
  - visual:      {"question": str, "image_description": str, "answer": str}

`prerequisite_task_ids` is a UUID array — tasks that must be completed before
this one becomes available in the sequencing logic.

`is_generated` tracks whether this task was LLM-generated (for filtering/audit).
"""

import enum
import uuid
from typing import Optional

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlmodel import Field, SQLModel


class ContentType(str, enum.Enum):
    text = "text"
    interactive = "interactive"
    visual = "visual"


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: uuid.UUID = Field(
        sa_column=sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    )
    subject: str = Field(nullable=False, max_length=100)
    skill_tag: str = Field(nullable=False, max_length=100)
    difficulty_level: int = Field(nullable=False, ge=1, le=5)
    expected_duration_seconds: int = Field(nullable=False, ge=5)
    content_type: ContentType = Field(
        sa_column=sa.Column(
            sa.Enum(ContentType, name="content_type", create_type=True),
            nullable=False,
        )
    )
    content_body: dict = Field(
        default_factory=dict,
        sa_column=sa.Column(sa.JSON().with_variant(JSONB, "postgresql"), nullable=False),
    )
    prerequisite_task_ids: list[uuid.UUID] = Field(
        default_factory=list,
        sa_column=sa.Column(
            sa.JSON().with_variant(ARRAY(sa.UUID(as_uuid=True)), "postgresql"),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )
    is_generated: bool = Field(
        default=False,
        sa_column=sa.Column(sa.Boolean, nullable=False, server_default=sa.text("false")),
    )
    parent_task_id: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=sa.Column(
            sa.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    grounding_chunk_ids: Optional[list[uuid.UUID]] = Field(
        default=None,
        sa_column=sa.Column(
            sa.JSON().with_variant(ARRAY(sa.UUID(as_uuid=True)), "postgresql"),
            nullable=True,
        ),
    )
    is_ai_generated: bool = Field(
        default=False,
        sa_column=sa.Column(sa.Boolean, nullable=False, server_default=sa.text("false")),
    )
