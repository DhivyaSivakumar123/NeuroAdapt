"""
Router for managing virtual meetings and live class sessions.
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_

from app.deps import get_current_user, get_db, require_role
from app.models.profile import Profile, UserRole
from app.models.meeting import Meeting
from app.schemas.meeting import (
    MeetingCreate,
    MeetingUpdate,
    MeetingResponse,
    MeetingListResponse,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


def _normalize_url(url: str) -> str:
    url = url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        return f"https://{url}"
    return url


@router.get("", response_model=MeetingListResponse)
def list_meetings(
    target_date: Optional[date] = Query(None, description="Filter meetings by date (YYYY-MM-DD)"),
    status_filter: Optional[str] = Query(None, description="Filter by status (upcoming, live, completed)"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """
    List scheduled meetings with time priority.
    - If target_date is provided, filters to that specific date.
    - Meetings are ordered by meeting_date ASC and start_time ASC.
    """
    query = select(Meeting)

    conditions = []
    if target_date:
        conditions.append(Meeting.meeting_date == target_date)
    if status_filter:
        conditions.append(Meeting.status == status_filter)

    # If user is a student, show class-wide meetings (student_id is None) or meetings specifically for them
    user_role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role_val == "student":
        conditions.append(
            or_(
                Meeting.student_id.is_(None),
                Meeting.student_id == "",
                Meeting.student_id == str(current_user.id),
            )
        )

    if conditions:
        query = query.where(and_(*conditions))

    query = query.order_by(Meeting.meeting_date.asc(), Meeting.start_time.asc())
    results = db.execute(query).scalars().all()

    return MeetingListResponse(
        meetings=[MeetingResponse.model_validate(m) for m in results],
        total=len(results),
    )


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    meeting_in: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("teacher")),
):
    """Create a new live class or meeting (Teacher only)."""
    meeting = Meeting(
        title=meeting_in.title,
        subject=meeting_in.subject,
        teacher_id=current_user.id,
        student_id=meeting_in.student_id,
        meeting_link=_normalize_url(meeting_in.meeting_link),
        meeting_date=meeting_in.meeting_date,
        start_time=meeting_in.start_time,
        end_time=meeting_in.end_time,
        status=meeting_in.status,
        description=meeting_in.description,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return MeetingResponse.model_validate(meeting)


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    """Get single meeting details."""
    meeting = db.execute(select(Meeting).where(Meeting.id == meeting_id)).scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return MeetingResponse.model_validate(meeting)


@router.put("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    meeting_id: str,
    meeting_in: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("teacher")),
):
    """Update meeting details or status (Teacher only)."""
    meeting = db.execute(select(Meeting).where(Meeting.id == meeting_id)).scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    update_data = meeting_in.model_dump(exclude_unset=True)
    if "meeting_link" in update_data and update_data["meeting_link"]:
        update_data["meeting_link"] = _normalize_url(update_data["meeting_link"])

    for field, value in update_data.items():
        setattr(meeting, field, value)

    db.commit()
    db.refresh(meeting)
    return MeetingResponse.model_validate(meeting)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("teacher")),
):
    """Delete a meeting (Teacher only)."""
    meeting = db.execute(select(Meeting).where(Meeting.id == meeting_id)).scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    db.delete(meeting)
    db.commit()
    return None
