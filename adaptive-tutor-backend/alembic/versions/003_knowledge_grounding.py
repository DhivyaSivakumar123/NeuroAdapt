"""Add knowledge grounding tables and task grounding fields

Revision ID: 003
Revises: 002
Create Date: 2026-09-05 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from pgvector.sqlalchemy import Vector


revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 2. Create knowledge_sources table
    op.create_table(
        "knowledge_sources",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("subject", sa.String(100), nullable=False, index=True),
        sa.Column("source_name", sa.String(255), nullable=False),
        sa.Column("license", sa.String(100), nullable=False, server_default="CC BY 4.0"),
        sa.Column("source_url", sa.String(500), nullable=False),
        sa.Column("ingested_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # 3. Create knowledge_chunks table
    op.create_table(
        "knowledge_chunks",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "source_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("knowledge_sources.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("subject", sa.String(100), nullable=False, index=True),
        sa.Column("skill_tag", sa.String(100), nullable=False, index=True),
        sa.Column("chunk_text", sa.Text(), nullable=False),
        sa.Column("embedding", Vector(384), nullable=True),
        sa.Column("section_title", sa.String(255), nullable=True),
        sa.Column("page_or_section_ref", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # 4. Add grounding fields to tasks table
    op.add_column(
        "tasks",
        sa.Column("grounding_chunk_ids", ARRAY(sa.UUID(as_uuid=True)), nullable=True),
    )
    op.add_column(
        "tasks",
        sa.Column("is_ai_generated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("tasks", "is_ai_generated")
    op.drop_column("tasks", "grounding_chunk_ids")
    op.drop_table("knowledge_chunks")
    op.drop_table("knowledge_sources")
