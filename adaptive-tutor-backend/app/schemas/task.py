"""Task schemas — request/response DTOs for the task router."""

import uuid
from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.models.task import ContentType


class TaskResponse(BaseModel):
    id: uuid.UUID
    subject: str
    skill_tag: str
    difficulty_level: int
    expected_duration_seconds: int
    content_type: ContentType
    content_body: dict[str, Any]
    prerequisite_task_ids: list[uuid.UUID] = Field(default_factory=list)
    is_generated: bool = False
    parent_task_id: uuid.UUID | None = None

    model_config = {"from_attributes": True}

    @field_validator("prerequisite_task_ids", mode="before")
    @classmethod
    def coerce_prereqs(cls, v: Any) -> list:
        if v is None:
            return []
        return v

    @field_validator("is_generated", mode="before")
    @classmethod
    def coerce_is_generated(cls, v: Any) -> bool:
        if v is None:
            return False
        return bool(v)



class AnswerSubmitRequest(BaseModel):
    """Request body for POST /tasks/{id}/submit."""

    answer: str = Field(..., min_length=1, max_length=2000)
    session_id: uuid.UUID
    actual_duration_seconds: int = Field(..., ge=0)


class AnswerSubmitResponse(BaseModel):
    correct: bool
    feedback: str  # e.g. "Correct!" or "Not quite — try thinking about X"
    task_id: uuid.UUID
    session_id: uuid.UUID


class TaskCatalogResponse(BaseModel):
    """List of tasks with available subjects and skill filters for curriculum explorer."""

    tasks: list[TaskResponse]
    subjects: list[str]
    skill_tags: list[str]
    total: int
