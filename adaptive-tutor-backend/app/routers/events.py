"""
Events router — POST /events endpoint for all 9 interaction event types.

The event router is the heart of the engagement pipeline:
  POST /events → persists event → if scoring event → computes engagement score
               → if score > threshold → triggers intervention

All side effects happen synchronously (no queue at this scale — V1).
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.deps import get_current_user, get_db
from app.models.interaction_event import SCORING_EVENT_TYPES, EventType, InteractionEvent
from app.models.profile import Profile
from app.models.session import Session as LearningSession
from app.models.task import Task
from app.schemas.event import EventCreate, EventResponse

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def log_event(
    body: EventCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
) -> EventResponse:
    """
    Log an interaction event for a session/task.
    Validates event_type and payload shape via discriminated union (see schemas/event.py).
    
    Triggers engagement scoring + intervention check for:
      task_complete, task_abandon, retry, idle_ping, self_report
    """
    # Validate session exists and belongs to this user (defense in depth)
    session = db.get(LearningSession, body.session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    # Validate task exists
    task = db.get(Task, body.task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    # Extract the discriminated event_type from the payload
    event_type_str = body.payload.event_type
    event_type = EventType(event_type_str)

    # Extract payload dict — only the defined fields (data minimization enforced by Pydantic)
    payload_dict = body.payload.model_dump(exclude={"event_type"})

    # Create event record
    event = InteractionEvent(
        session_id=body.session_id,
        task_id=body.task_id,
        event_type=event_type,
        timestamp=body.timestamp or datetime.now(timezone.utc),
        payload=payload_dict,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # ── Scoring hook ──────────────────────────────────────────────────────────
    event_id = event.id
    # Only fire for events that are relevant to engagement scoring.
    if event_type in SCORING_EVENT_TYPES:
        try:
            from app.services.engagement_engine import compute_and_persist_score
            from app.services.intervention_engine import check_and_trigger

            score_row = compute_and_persist_score(
                db=db,
                session_id=body.session_id,
                task_id=body.task_id,
                triggering_event_type=event_type_str,
                expected_duration_seconds=task.expected_duration_seconds,
            )

            # Check if intervention should be triggered
            intervention = check_and_trigger(
                db=db,
                session_id=body.session_id,
                task_id=body.task_id,
                engagement_score_row=score_row,
            )
            if intervention:
                db.commit()  # commit the intervention + any generated task

        except Exception as exc:
            # Scoring/intervention failures must NOT block event persistence.
            # Roll back the failed transaction block and log the error.
            db.rollback()
            import logging
            logging.getLogger(__name__).error(
                "Scoring/intervention error after event %s: %s", event_id, exc, exc_info=True
            )

    return EventResponse(
        id=event_id,
        session_id=body.session_id,
        task_id=body.task_id,
        event_type=event_type_str,
        timestamp=event.timestamp,
    )
