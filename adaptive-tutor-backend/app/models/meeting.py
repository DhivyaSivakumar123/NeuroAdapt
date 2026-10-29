"""SQLModel model for live meetings and virtual classrooms."""

import uuid
from datetime import date, datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class Meeting(SQLModel, table=True):
    """Represents a scheduled virtual meeting or live class created by a teacher."""

    __tablename__ = "meetings"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str = Field(..., max_length=255)
    subject: str = Field(default="General", max_length=100)
    teacher_id: Optional[str] = Field(default=None, max_length=255)
    student_id: Optional[str] = Field(default=None, max_length=255)  # null = all students / class-wide
    meeting_link: str = Field(..., max_length=500)
    meeting_date: date = Field(default_factory=date.today)
    start_time: str = Field(..., max_length=20)  # e.g. "01:00 PM" or "13:00"
    end_time: str = Field(..., max_length=20)    # e.g. "02:00 PM" or "14:00"
    status: str = Field(default="upcoming", max_length=50)  # upcoming, live, completed, cancelled
    description: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
