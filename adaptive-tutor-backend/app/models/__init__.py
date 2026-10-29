"""Models package — import hub for Alembic to discover all table definitions."""

from app.models.profile import Profile, UserRole  # noqa: F401
from app.models.student import Student  # noqa: F401
from app.models.student_teacher import StudentTeacher  # noqa: F401
from app.models.task import Task, ContentType  # noqa: F401
from app.models.session import Session  # noqa: F401
from app.models.interaction_event import InteractionEvent, EventType  # noqa: F401
from app.models.engagement_score import EngagementScore  # noqa: F401
from app.models.intervention import Intervention, InterventionType, InterventionOutcome  # noqa: F401
from app.models.knowledge_source import KnowledgeSource  # noqa: F401
from app.models.knowledge_chunk import KnowledgeChunk  # noqa: F401
from app.models.meeting import Meeting  # noqa: F401
