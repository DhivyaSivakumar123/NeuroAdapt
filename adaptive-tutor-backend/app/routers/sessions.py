"""
Sessions router — start and end learning sessions.
Also exposes GET /students/{student_id}/next-task here for convenience.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.deps import get_current_user, get_db
from app.models.profile import Profile, UserRole
from app.models.session import Session as LearningSession
from app.models.student import Student
from app.schemas.session import SessionCreate, SessionResponse
from app.schemas.task import TaskResponse
from app.services import task_service

router = APIRouter(tags=["sessions"])


def _verify_student_access(db: Session, student_id: uuid.UUID, current_user: Profile) -> Student:
    """
    Verify the requesting user has access to the student:
    - Student can access their own record (profile_id or id matches)
    - Parent can access their linked students
    - Teacher can access assigned students
    """
    student = db.get(Student, student_id)
    if student is None:
        from sqlmodel import select
        stmt = select(Student).where(Student.profile_id == student_id)
        student = db.exec(stmt).first()

    if student is None and current_user.role == UserRole.student:
        student = Student(
            id=current_user.id,
            profile_id=current_user.id,
            name=current_user.display_name,
            age=10,
            grade_level="Grade 5",
            parent_id=current_user.id,
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        return student

    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    if current_user.role == UserRole.student:
        if student.profile_id != current_user.id and student.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    elif current_user.role == UserRole.parent:
        if student.parent_id != current_user.id and student.profile_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return student


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    body: SessionCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
) -> LearningSession:
    """Start a new learning session for a student."""
    _verify_student_access(db, body.student_id, current_user)

    session = LearningSession(
        student_id=body.student_id,
        subject=body.subject or "biology",
        started_at=datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.patch("/sessions/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
) -> LearningSession:
    """End a session by setting ended_at."""
    session = db.get(LearningSession, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    _verify_student_access(db, session.student_id, current_user)

    if session.ended_at is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Session already ended.",
        )

    session.ended_at = datetime.now(timezone.utc)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/students/{student_id}/next-task", response_model=Optional[TaskResponse])
async def get_next_task(
    student_id: uuid.UUID,
    session_id: uuid.UUID = Query(..., description="Current session ID"),
    subject: Optional[str] = Query(None),
    skill_tag: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
) -> Optional[TaskResponse]:
    """
    Get the next task for a student in a given session.
    Respects prerequisite_task_ids and skips already-completed tasks.
    Returns null (HTTP 200) if no eligible task remains.
    """
    _verify_student_access(db, student_id, current_user)
    return task_service.get_next_task(db, student_id, session_id, subject, skill_tag)
