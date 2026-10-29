"""Student schemas for creating, updating, and viewing student profiles."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class StudentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=255)
    age: int = Field(10, ge=1, le=120)
    grade_level: str = Field("Grade 5", min_length=1, max_length=50)
    learner_profile_tags: list[str] = Field(default_factory=list)


class StudentUpdate(BaseModel):
    name: str | None = None
    age: int | None = None
    grade_level: str | None = None
    learner_profile_tags: list[str] | None = None


class StudentResponse(BaseModel):
    id: uuid.UUID
    profile_id: uuid.UUID | None = None
    name: str
    age: int
    grade_level: str
    learner_profile_tags: list[str] = []
    parent_id: uuid.UUID
    created_at: datetime


class AssignStudentRequest(BaseModel):
    student_id: uuid.UUID


class AssignStudentByQueryRequest(BaseModel):
    query: str  # student name or student ID prefix
