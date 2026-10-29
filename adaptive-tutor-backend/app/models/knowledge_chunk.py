"""
Knowledge Chunk model.

Passage-level grounded knowledge chunks ingested from open sources,
with vector embeddings for retrieval-augmented content generation.
"""

import datetime
import uuid
from typing import Optional

import sqlalchemy as sa
from pgvector.sqlalchemy import Vector
from sqlmodel import Field, SQLModel


class KnowledgeChunk(SQLModel, table=True):
    __tablename__ = "knowledge_chunks"

    id: uuid.UUID = Field(
        sa_column=sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    )
    source_id: uuid.UUID = Field(
        sa_column=sa.Column(
            sa.UUID(as_uuid=True),
            sa.ForeignKey("knowledge_sources.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    subject: str = Field(nullable=False, max_length=100, index=True)
    skill_tag: str = Field(nullable=False, max_length=100, index=True)
    chunk_text: str = Field(sa_column=sa.Column(sa.Text, nullable=False))
    embedding: Optional[list[float]] = Field(
        default=None,
        sa_column=sa.Column(
            sa.JSON().with_variant(Vector(384), "postgresql"),
            nullable=True,
        ),
    )
    section_title: Optional[str] = Field(default=None, max_length=255)
    page_or_section_ref: Optional[str] = Field(default=None, max_length=100)
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column=sa.Column(sa.DateTime(timezone=True), nullable=False),
    )
