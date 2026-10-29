"""Pydantic schemas for Meeting endpoints."""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class MeetingBase(BaseModel):
    title: str = Field(..., max_length=255, description="Title of the meeting/class")
    subject: str = Field("General", max_length=100, description="Subject of the live session")
    meeting_link: str = Field(..., max_length=500, description="Google Meet, Zoom, or other meeting URL")
    meeting_date: date = Field(default_factory=date.today, description="Date of the meeting (YYYY-MM-DD)")
    start_time: str = Field(..., description="Start time (e.g., '01:00 PM' or '13:00')")
    end_time: str = Field(..., description="End time (e.g., '02:00 PM' or '14:00')")
    status: str = Field("upcoming", description="Meeting status: upcoming, live, completed, cancelled")
    student_id: Optional[str] = Field(None, description="Optional target student ID, or null for entire class")
    description: Optional[str] = Field(None, description="Optional description or topics to cover")


class MeetingCreate(MeetingBase):
    pass


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    meeting_link: Optional[str] = None
    meeting_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    student_id: Optional[str] = None
    description: Optional[str] = None


class MeetingResponse(MeetingBase):
    id: str
    teacher_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MeetingListResponse(BaseModel):
    meetings: List[MeetingResponse]
    total: int
