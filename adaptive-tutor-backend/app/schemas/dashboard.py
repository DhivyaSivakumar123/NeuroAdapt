"""Dashboard schemas — response DTOs for the parent/teacher dashboard endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.engagement import EngagementScoreResponse
from app.schemas.intervention import InterventionResponse


class SubjectProgressDetail(BaseModel):
    """Subject progress metrics computed directly from task catalog and session telemetry."""

    subject: str
    completed: int
    total: int
    mastery_percentage: int
    status: str
    color: str


class StudentEngagementTrend(BaseModel):
    """Engagement score trend for a single student over time."""

    student_id: uuid.UUID
    student_name: str
    grade_level: str | None = None
    learner_profile_tags: list[str] = []
    scores: list[EngagementScoreResponse]
    latest_classification: str | None
    subject_progress: list[SubjectProgressDetail] = []


class InterventionHistory(BaseModel):
    """Intervention history for a single student."""

    student_id: uuid.UUID
    student_name: str
    interventions: list[InterventionResponse]


class FlaggedStudent(BaseModel):
    """A student currently in the monitor or trigger band."""

    student_id: uuid.UUID
    student_name: str
    latest_score: float
    classification: str  # "flag_monitor" or "trigger_intervention"
    latest_computed_at: datetime


class DashboardFlags(BaseModel):
    """List of students needing attention."""

    flagged: list[FlaggedStudent]


class RosterStudent(BaseModel):
    """A student in a parent's or teacher's assigned roster."""

    student_id: uuid.UUID
    student_name: str
    grade_level: str
    learner_profile_tags: list[str] = []
    latest_score: float | None = 1.0
    classification: str | None = "no_action"
    latest_computed_at: datetime | None = None


class DashboardRoster(BaseModel):
    """List of all assigned/linked students for the authenticated parent or teacher."""

    students: list[RosterStudent]


class SkillFrictionMetric(BaseModel):
    """Skill or topic showing student struggle/friction."""

    skill_tag: str
    subject: str
    total_attempts: int
    retry_count: int
    avg_score: float
    interventions_count: int


class ClassAnalyticsResponse(BaseModel):
    """Aggregate analytics for a teacher's class or parent's children."""

    total_students: int
    optimal_count: int
    monitoring_count: int
    intervention_count: int
    avg_engagement_score: float
    recent_interventions_count: int
    skill_friction: list[SkillFrictionMetric] = []


class ParentGuidanceTip(BaseModel):
    """Contextual guidance tip based on observed behavioral signals."""

    title: str
    strategy: str
    category: str  # e.g., "pacing", "modality", "breaks", "focus"
    recommended_action: str


class ParentGuidanceResponse(BaseModel):
    """Parent actionable insights for supporting their learner."""

    student_id: uuid.UUID
    student_name: str
    current_status: str
    tips: list[ParentGuidanceTip]


class AIStudentAnalysisDetails(BaseModel):
    """Structured neurodivergent pedagogical analysis from Groq LLM."""

    superpowers_and_strengths: str
    cognitive_bottlenecks: str
    teacher_action_plan: list[str]
    parent_support_cue: str
    recommended_next_module: str


class AIStudentAnalysisResponse(BaseModel):
    """Complete AI recommendation response for teachers and parents."""

    student_id: uuid.UUID
    student_name: str
    analysis: AIStudentAnalysisDetails
    source: str = "llm"
