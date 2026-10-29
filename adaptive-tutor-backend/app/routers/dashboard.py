"""
Dashboard router — parent and teacher read-only views and class-level analytics.

Role scoping:
  - Parents: access data for their own students only
  - Teachers: access data for students in their student_teacher assignments only
Enforced both by explicit WHERE clauses in dashboard_service.py and access checks.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.deps import get_current_user, get_db, require_role
from app.models.profile import Profile, UserRole
from app.schemas.dashboard import (
    ClassAnalyticsResponse,
    DashboardFlags,
    DashboardRoster,
    FlaggedStudent,
    InterventionHistory,
    ParentGuidanceResponse,
    ParentGuidanceTip,
    AIStudentAnalysisResponse,
    AIStudentAnalysisDetails,
    RosterStudent,
    StudentEngagementTrend,
    SubjectProgressDetail,
)
from app.schemas.engagement import EngagementScoreResponse
from app.schemas.intervention import InterventionResponse
from app.services import dashboard_service
from app.services.engagement_engine import classify

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _is_parent(current_user: Profile) -> bool:
    return current_user.role == UserRole.parent


@router.get(
    "/students/{student_id}/engagement",
    response_model=StudentEngagementTrend,
    summary="Engagement trend for a student",
)
async def get_engagement_trend(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("parent", "teacher")),
) -> StudentEngagementTrend:
    """Engagement score trend for a student over time. Parent or teacher only."""
    is_parent = _is_parent(current_user)
    try:
        scores = dashboard_service.get_engagement_trend_for_student(
            db, student_id, current_user.id, is_parent
        )
        subject_prog_data = dashboard_service.get_subject_progress_for_student(
            db, student_id, current_user.id, is_parent
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    score_responses = [
        EngagementScoreResponse(
            id=s.id,
            session_id=s.session_id,
            task_id=s.task_id,
            computed_score=s.computed_score,
            computed_at=s.computed_at,
            signals_snapshot=s.signals_snapshot,
            classification=classify(s.computed_score),
        )
        for s in scores
    ]

    from app.models.student import Student
    student = db.get(Student, student_id)
    student_name = student.name if student else "Unknown"
    grade_level = student.grade_level if student else None
    learner_profile_tags = student.learner_profile_tags if student else []

    subject_progress = [
        SubjectProgressDetail(**p) for p in subject_prog_data
    ]

    return StudentEngagementTrend(
        student_id=student_id,
        student_name=student_name,
        grade_level=grade_level,
        learner_profile_tags=learner_profile_tags,
        scores=score_responses,
        latest_classification=score_responses[-1].classification if score_responses else None,
        subject_progress=subject_progress,
    )


@router.get(
    "/students/{student_id}/interventions",
    response_model=InterventionHistory,
    summary="Intervention history for a student",
)
async def get_intervention_history(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("parent", "teacher")),
) -> InterventionHistory:
    """Intervention history and outcomes for a student. Parent or teacher only."""
    is_parent = _is_parent(current_user)
    try:
        interventions = dashboard_service.get_interventions_for_student(
            db, student_id, current_user.id, is_parent
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    intervention_responses = [
        InterventionResponse(
            id=i.id,
            session_id=i.session_id,
            task_id=i.task_id,
            intervention_type=i.intervention_type,
            triggered_at=i.triggered_at,
            outcome=i.outcome,
            generated_content_id=i.generated_content_id,
        )
        for i in interventions
    ]

    from app.models.student import Student
    student = db.get(Student, student_id)
    student_name = student.name if student else "Unknown"

    return InterventionHistory(
        student_id=student_id,
        student_name=student_name,
        interventions=intervention_responses,
    )


@router.get(
    "/students/{student_id}/guidance",
    response_model=ParentGuidanceResponse,
    summary="Actionable guidance tips for parents/teachers",
)
async def get_guidance(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("parent", "teacher")),
) -> ParentGuidanceResponse:
    """Returns tailored pedagogical tips based on recent student signals."""
    is_parent = _is_parent(current_user)
    try:
        guidance = dashboard_service.get_parent_guidance(
            db, student_id, current_user.id, is_parent
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    return ParentGuidanceResponse(
        student_id=guidance["student_id"],
        student_name=guidance["student_name"],
        current_status=guidance["current_status"],
        tips=[ParentGuidanceTip(**t) for t in guidance["tips"]],
    )


@router.get(
    "/students/{student_id}/ai-analysis",
    response_model=AIStudentAnalysisResponse,
    summary="Groq LLM-powered pedagogical analysis and recommendations for student",
)
async def get_ai_analysis(
    student_id: uuid.UUID,
    force_refresh: bool = False,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("parent", "teacher")),
) -> AIStudentAnalysisResponse:
    """Returns Groq-generated personalized pedagogical insights and action plan."""
    is_parent = _is_parent(current_user)
    try:
        result = dashboard_service.get_ai_student_analysis(
            db, student_id, current_user.id, is_parent, force_refresh=force_refresh
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    return AIStudentAnalysisResponse(
        student_id=result["student_id"],
        student_name=result["student_name"],
        analysis=AIStudentAnalysisDetails(**result["analysis"]),
        source=result.get("source", "llm"),
    )


@router.get(
    "/flags",
    response_model=DashboardFlags,
    summary="Students needing attention (in monitor or trigger band)",
)
async def get_flagged_students(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("parent", "teacher")),
) -> DashboardFlags:
    """
    Returns students in the flag_monitor or trigger_intervention band.
    Parent sees their own children; teacher sees their assigned students.
    """
    is_parent = _is_parent(current_user)
    flagged_data = dashboard_service.get_flagged_students(db, current_user.id, is_parent)

    flagged = [
        FlaggedStudent(
            student_id=f["student_id"],
            student_name=f["student_name"],
            latest_score=f["latest_score"],
            classification=f["classification"],
            latest_computed_at=f["latest_computed_at"],
        )
        for f in flagged_data
    ]

    return DashboardFlags(flagged=flagged)


@router.get(
    "/roster",
    response_model=DashboardRoster,
    summary="All linked/assigned students for a parent or teacher",
)
async def get_dashboard_roster(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("parent", "teacher")),
) -> DashboardRoster:
    """
    Returns ALL students linked to a parent or assigned to a teacher.
    Parent sees their linked children; teacher sees their assigned roster.
    """
    is_parent = _is_parent(current_user)
    roster_data = dashboard_service.get_roster_for_user(db, current_user.id, is_parent)

    students = [
        RosterStudent(
            student_id=r["student_id"],
            student_name=r["student_name"],
            grade_level=r["grade_level"],
            learner_profile_tags=r.get("learner_profile_tags", []),
            latest_score=r["latest_score"],
            classification=r["classification"],
            latest_computed_at=r["latest_computed_at"],
        )
        for r in roster_data
    ]

    return DashboardRoster(students=students)


@router.get(
    "/analytics",
    response_model=ClassAnalyticsResponse,
    summary="Aggregate class or group analytics",
)
async def get_analytics(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("parent", "teacher")),
) -> ClassAnalyticsResponse:
    """Returns aggregate class metrics, distribution, and skill friction points."""
    is_parent = _is_parent(current_user)
    analytics_data = dashboard_service.get_class_analytics(db, current_user.id, is_parent)
    return ClassAnalyticsResponse(**analytics_data)
