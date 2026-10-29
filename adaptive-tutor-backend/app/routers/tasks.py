"""
Tasks router — task listing, catalog browsing, and answer evaluation.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.deps import get_current_user, get_db
from app.models.interaction_event import EventType, InteractionEvent
from app.models.profile import Profile
from app.models.task import ContentType
from app.schemas.task import (
    AnswerSubmitRequest,
    AnswerSubmitResponse,
    TaskCatalogResponse,
    TaskResponse,
)
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskResponse], summary="List tasks")
async def list_tasks(
    subject: Optional[str] = Query(None, description="Filter by subject"),
    skill_tag: Optional[str] = Query(None, description="Filter by skill tag"),
    content_type: Optional[ContentType] = Query(None, description="Filter by content type"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: Profile = Depends(get_current_user),
) -> list:
    return task_service.list_tasks(db, subject, skill_tag, content_type, limit, offset)


@router.get("/catalog", response_model=TaskCatalogResponse, summary="Curriculum & task catalog")
async def get_task_catalog(
    subject: Optional[str] = Query(None, description="Filter by subject"),
    skill_tag: Optional[str] = Query(None, description="Filter by skill tag"),
    difficulty_level: Optional[int] = Query(None, ge=1, le=5, description="Filter by difficulty"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: Profile = Depends(get_current_user),
) -> TaskCatalogResponse:
    data = task_service.get_task_catalog(db, subject, skill_tag, difficulty_level, limit, offset)
    return TaskCatalogResponse(**data)


@router.get("/{task_id}", response_model=TaskResponse, summary="Get a task by ID")
async def get_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: Profile = Depends(get_current_user),
) -> TaskResponse:
    task = task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return task


@router.post(
    "/{task_id}/submit",
    response_model=AnswerSubmitResponse,
    summary="Submit an answer for a task",
)
async def submit_answer(
    task_id: uuid.UUID,
    body: AnswerSubmitRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
) -> AnswerSubmitResponse:
    task = task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    correct, feedback = task_service.evaluate_answer(task, body.answer)

    # Persist interaction events so next-task selection instantly knows this task is done
    from app.models.session import Session as LearningSession
    valid_session = db.get(LearningSession, body.session_id)
    if valid_session:
        submit_ev = InteractionEvent(
            session_id=body.session_id,
            task_id=task_id,
            event_type=EventType.answer_submit,
            payload={"correct": correct, "answer_given": body.answer},
        )
        db.add(submit_ev)

        if correct:
            complete_ev = InteractionEvent(
                session_id=body.session_id,
                task_id=task_id,
                event_type=EventType.task_complete,
                payload={"correct": True, "actual_duration_seconds": body.actual_duration_seconds},
            )
            db.add(complete_ev)

        db.commit()

    return AnswerSubmitResponse(
        correct=correct,
        feedback=feedback,
        task_id=task_id,
        session_id=body.session_id,
    )
