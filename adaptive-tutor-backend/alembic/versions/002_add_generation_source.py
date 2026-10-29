"""Add generation_source to interventions table

Revision ID: 002
Revises: 001
Create Date: 2026-08-30 20:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "interventions",
        sa.Column(
            "generation_source",
            sa.String(50),
            nullable=False,
            server_default="llm",
        ),
    )


def downgrade() -> None:
    op.drop_column("interventions", "generation_source")
