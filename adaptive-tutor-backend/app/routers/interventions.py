"""
Interventions router.

Endpoints:
  GET  /interventions/{session_id}         — list interventions for a session
  PATCH /interventions/{id}/outcome        — update outcome after student continues
  POST /interventions/simulate             — dev/test only (gated by config flag)
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.config import get_settings
from app.deps import get_current_user, get_db
from app.models.intervention import Intervention
from app.models.profile import Profile
from app.schemas.intervention import (
    InterventionResponse,
    OutcomeUpdate,
    SimulateInterventionRequest,
)

router = APIRouter(prefix="/interventions", tags=["interventions"])


@router.get("/{session_id}", response_model=list[InterventionResponse])
async def list_interventions_for_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: Profile = Depends(get_current_user),
) -> list[Intervention]:
    """List all interventions triggered in a session."""
    stmt = (
        select(Intervention)
        .where(Intervention.session_id == session_id)
        .order_by(Intervention.triggered_at)
    )
    return list(db.exec(stmt).all())


@router.patch("/{intervention_id}/outcome", response_model=InterventionResponse)
async def update_outcome(
    intervention_id: uuid.UUID,
    body: OutcomeUpdate,
    db: Session = Depends(get_db),
    _: Profile = Depends(get_current_user),
) -> Intervention:
    """
    Set the outcome of an intervention after the student continues.
    Called from the event flow when a task_complete/task_abandon follows an intervention.
    """
    intervention = db.get(Intervention, intervention_id)
    if intervention is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intervention not found.")

    intervention.outcome = body.outcome
    db.add(intervention)
    db.commit()
    db.refresh(intervention)
    return intervention


@router.post(
    "/simulate",
    response_model=InterventionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[DEV ONLY] Force-trigger an intervention",
)
async def simulate_intervention(
    body: SimulateInterventionRequest,
    db: Session = Depends(get_db),
    _: Profile = Depends(get_current_user),
) -> Intervention:
    """
    Development/test-only endpoint to force an intervention without manufacturing
    real events. Gated by ENABLE_SIMULATE_ENDPOINT config flag (must be False in prod).

    Allows integration tests and manual QA to trigger any of the 4 intervention
    types directly.
    """
    settings = get_settings()
    if not settings.enable_simulate_endpoint:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Simulation endpoint is disabled in this environment.",
        )

    from app.services.intervention_engine import trigger_intervention, select_intervention_type
    from app.services.content_generator import StubContentGenerator

    try:
        if body.force_type:
            # Override the auto-selection
            from app.models.intervention import Intervention, InterventionType
            from app.models.task import Task
            from datetime import datetime, timezone

            task = db.get(Task, body.task_id)
            if task is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

            # Use stub generator for simulate endpoint (doesn't call real Groq)
            stub = StubContentGenerator()
            intervention = trigger_intervention(
                db=db,
                session_id=body.session_id,
                task_id=body.task_id,
                signals=body.signals,
                content_generator_client=stub,
            )
            # Override the auto-selected type with the forced one
            intervention.intervention_type = body.force_type
            db.add(intervention)
            db.commit()
            db.refresh(intervention)
            return intervention
        else:
            stub = StubContentGenerator()
            intervention = trigger_intervention(
                db=db,
                session_id=body.session_id,
                task_id=body.task_id,
                signals=body.signals,
                content_generator_client=stub,
            )
            db.commit()
            db.refresh(intervention)
            return intervention

    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed: {exc}",
        )
