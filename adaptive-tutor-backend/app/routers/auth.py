"""
Auth router — JWT verification, profile management, and resilient registration.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from supabase import create_client

from app.config import get_settings
from app.deps import get_current_user, get_db
from app.models.profile import Profile, UserRole
from app.models.student import Student
from app.schemas.auth import ProfileCreate, ProfileResponse, ProfileUpdate, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.get("/me", response_model=ProfileResponse, summary="Get current user's profile")
def get_me(current_user: Profile = Depends(get_current_user)) -> Profile:
    """
    Returns the profile associated with the current JWT.
    Useful to verify token validity and extract role.
    """
    return current_user


@router.patch(
    "/profile",
    response_model=ProfileResponse,
    summary="Update current user's profile display name or role",
)
def update_profile(
    body: ProfileUpdate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Profile:
    """
    Updates the authenticated user's display name and/or role in the database profile table.
    """
    if body.display_name is not None and body.display_name.strip():
        current_user.display_name = body.display_name.strip()
    if body.role is not None:
        current_user.role = body.role
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post(
    "/profile",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or update profile after Supabase signup",
)
def create_profile(
    body: ProfileCreate,
    db: Session = Depends(get_db),
) -> Profile:
    """
    Called after a user signs up. If profile already exists (e.g. from auto-provisioning),
    updates role and display_name to the user's explicit selection.
    """
    existing = db.get(Profile, body.id)
    if existing:
        existing.role = body.role
        existing.display_name = body.display_name
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    profile = Profile(
        id=body.id,
        role=body.role,
        display_name=body.display_name,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.post(
    "/register",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin-backed registration bypassing client signup rate limits",
)
def register_user(
    body: RegisterRequest,
    db: Session = Depends(get_db),
) -> Profile:
    """
    Creates a user directly via Supabase Auth Admin API (auto-confirmed)
    and creates the matching Profile in PostgreSQL, bypassing client-side IP rate limits.
    """
    supabase_admin = create_client(settings.supabase_url, settings.supabase_service_role_key)

    user_id = None
    try:
        res = supabase_admin.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": True,
            "user_metadata": {
                "role": body.role.value,
                "display_name": body.display_name,
            },
        })
        user_id = uuid.UUID(str(res.user.id))
    except Exception as exc:
        err_msg = str(exc)
        if "already registered" in err_msg.lower() or "unique" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email address is already registered. Please sign in instead.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {err_msg}",
        )

    # Create or update profile in PostgreSQL
    profile = db.get(Profile, user_id)
    if not profile:
        profile = Profile(
            id=user_id,
            role=body.role,
            display_name=body.display_name,
        )
        db.add(profile)

        # For student role, link self-student entity
        if body.role == UserRole.student:
            student = Student(
                id=user_id,
                name=body.display_name,
                age=12,
                grade_level="6th grade",
                parent_id=user_id,
                profile_id=user_id,
                learner_profile_tags=[],
            )
            db.add(student)

        db.commit()
        db.refresh(profile)
    else:
        profile.role = body.role
        profile.display_name = body.display_name
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profile
