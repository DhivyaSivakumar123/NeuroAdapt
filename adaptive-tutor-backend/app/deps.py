"""
FastAPI shared dependencies.

`get_db()` — DB session (re-exported from app.db.session for convenience).
`get_current_user()` — resolves profile from JWT; raises 401 on invalid token.
`require_role(*roles)` — factory returning a dependency that enforces role; raises 403.

Usage in a router:
    @router.get("/teacher-only")
    async def teacher_endpoint(
        _: Profile = Depends(require_role("teacher")),
        db: Session = Depends(get_db),
    ): ...
"""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.core.security import InvalidTokenError, extract_user_id, verify_supabase_jwt
from app.db.session import get_db
from app.models.profile import Profile, UserRole
from app.models.student import Student
from app.models.student_teacher import StudentTeacher

# Re-export get_db so routers only need to import from deps
__all__ = ["get_db", "get_current_user", "require_role"]

_bearer = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    db: Session = Depends(get_db),
) -> Profile:
    """
    Validate the Bearer JWT, look up the corresponding Profile row.
    Raises 401 if the token is invalid/expired.
    Raises 404 if the user has a valid token but no profile yet (shouldn't happen in normal flow).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_supabase_jwt(credentials.credentials)
        user_id: uuid.UUID = extract_user_id(payload)
    except InvalidTokenError:
        raise credentials_exception

    user_metadata = payload.get("user_metadata", {}) or {}
    metadata_name = (
        user_metadata.get("display_name")
        or user_metadata.get("full_name")
        or user_metadata.get("name")
        or payload.get("name")
    )

    profile = db.get(Profile, user_id)
    if profile is None:
        role_str = user_metadata.get("role") or payload.get("role")
        try:
            resolved_role = (
                UserRole(role_str)
                if role_str and role_str in [r.value for r in UserRole]
                else UserRole.student
            )
        except Exception:
            resolved_role = UserRole.student

        display_name = metadata_name or (
            payload.get("email", "").split("@")[0] if "@" in payload.get("email", "") else "Learner"
        )
        profile = Profile(
            id=user_id,
            role=resolved_role,
            display_name=display_name,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    elif metadata_name and profile.display_name != metadata_name:
        profile.display_name = metadata_name
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Ensure profile has active student/parent/teacher relationship mappings
    _ensure_profile_relationships(db, profile)
    return profile


def _ensure_profile_relationships(db: Session, profile: Profile) -> None:
    """Ensure student role profile has an active Student record for tasks."""
    try:
        if profile.role == UserRole.student:
            existing = db.exec(select(Student).where(Student.profile_id == profile.id)).first()
            if not existing:
                student_rec = db.get(Student, profile.id)
                if student_rec is None:
                    student_rec = Student(
                        id=profile.id,
                        profile_id=profile.id,
                        name=profile.display_name,
                        age=10,
                        grade_level="Grade 5",
                        parent_id=profile.id,
                    )
                    db.add(student_rec)
                    db.commit()
    except Exception as exc:
        db.rollback()
        import logging
        logging.getLogger(__name__).warning("Failed to auto-ensure profile relationships: %s", exc)


def require_role(*roles: str):
    """
    Dependency factory: returns a dependency that ensures the current user
    has one of the specified roles.

    Usage:
        Depends(require_role("teacher"))
        Depends(require_role("parent", "teacher"))
    """
    allowed = {UserRole(r) for r in roles}

    def _check_role(
        current_user: Profile = Depends(get_current_user),
    ) -> Profile:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(roles)}.",
            )
        return current_user

    return _check_role
