"""Auth schemas — request/response DTOs for the auth router."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.profile import UserRole


class ProfileResponse(BaseModel):
    """Returned by GET /auth/me — the resolved profile for the current token."""

    id: uuid.UUID
    role: UserRole
    display_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileCreate(BaseModel):
    """Request body for POST /auth/profile — create a profile after Supabase signup."""

    id: uuid.UUID  # Must match auth.users.id from the JWT sub claim
    role: UserRole
    display_name: str


class ProfileUpdate(BaseModel):
    """Request body for PATCH /auth/profile — update profile display name or role."""

    display_name: str | None = None
    role: UserRole | None = None


class RegisterRequest(BaseModel):
    """Request body for POST /auth/register — backend-assisted admin signup."""

    email: str
    password: str
    role: UserRole
    display_name: str
