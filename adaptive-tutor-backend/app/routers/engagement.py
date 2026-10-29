"""
Engagement router — internal debug view of computed scores.
"""

import uuid

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.deps import get_current_user, get_db, require_role
from app.models.engagement_score import EngagementScore
from app.models.profile import Profile
from app.schemas.engagement import EngagementScoreResponse, SessionEngagementResponse
from app.services.engagement_engine import classify

router = APIRouter(prefix="/engagement", tags=["engagement"])


def _score_to_response(score: EngagementScore) -> EngagementScoreResponse:
    return EngagementScoreResponse(
        id=score.id,
        session_id=score.session_id,
        task_id=score.task_id,
        computed_score=score.computed_score,
        computed_at=score.computed_at,
        signals_snapshot=score.signals_snapshot,
        classification=classify(score.computed_score),
    )


@router.get("/{session_id}", response_model=SessionEngagementResponse)
async def get_session_engagement(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
) -> SessionEngagementResponse:
    """
    Internal debug view: list all engagement scores computed in a session.
    Accessible to any authenticated user (filtered by session ownership at RLS level).
    """
    stmt = (
        select(EngagementScore)
        .where(EngagementScore.session_id == session_id)
        .order_by(EngagementScore.computed_at)
    )
    scores = list(db.exec(stmt).all())
    score_responses = [_score_to_response(s) for s in scores]
    latest_classification = score_responses[-1].classification if score_responses else None

    return SessionEngagementResponse(
        session_id=session_id,
        scores=score_responses,
        latest_classification=latest_classification,
    )
