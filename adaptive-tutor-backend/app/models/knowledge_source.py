"""
Knowledge Source model.

Tracks original source material (e.g. OpenStax textbooks), licensing (CC BY 4.0),
and source metadata for attribution and auditing.
"""

import datetime
import uuid
from typing import Optional

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class KnowledgeSource(SQLModel, table=True):
    __tablename__ = "knowledge_sources"

    id: uuid.UUID = Field(
        sa_column=sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    )
    subject: str = Field(nullable=False, max_length=100, index=True)
    source_name: str = Field(nullable=False, max_length=255)
    license: str = Field(nullable=False, max_length=100, default="CC BY 4.0")
    source_url: str = Field(nullable=False, max_length=500)
    ingested_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column=sa.Column(sa.DateTime(timezone=True), nullable=False),
    )
