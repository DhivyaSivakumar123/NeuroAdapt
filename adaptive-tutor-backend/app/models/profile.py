"""
Profile model — extends Supabase auth.users with role + display name.

The `id` column is a UUID that references auth.users(id) in Supabase.
For the local test DB we manage auth ourselves (no Supabase auth service),
so the FK to auth.users is omitted from the SQLModel definition and enforced
only via the Supabase migration SQL (not Alembic, since auth.users is in the
Supabase auth schema, not public).
"""

import enum
import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class UserRole(str, enum.Enum):
    """Roles for the three user personas defined in the spec (Section 3)."""

    student = "student"
    parent = "parent"
    teacher = "teacher"


class Profile(SQLModel, table=True):
    """
    One profile per Supabase auth user.
    id = auth.users.id (UUID, managed by Supabase Auth).
    """

    __tablename__ = "profiles"

    id: uuid.UUID = Field(
        sa_column=sa.Column(
            sa.UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
        ),
    )
    role: UserRole = Field(
        sa_column=sa.Column(
            sa.Enum(UserRole, name="user_role", create_type=True),
            nullable=False,
        )
    )
    display_name: str = Field(nullable=False, max_length=255)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=sa.Column(
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
