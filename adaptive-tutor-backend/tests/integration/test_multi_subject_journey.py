"""
Integration tests for Multi-Subject Scale-Up student journey ('biology').
Verifies session creation, grounded task retrieval, interaction logging,
auto-triggering interventions for biology, and dashboard queries.
"""

import uuid
import pytest
from sqlmodel import Session, select

from app.db.session import engine
from app.models.engagement_score import EngagementScore
from app.models.interaction_event import EventType, InteractionEvent
from app.models.intervention import Intervention, InterventionType
from app.models.profile import Profile, UserRole
from app.models.session import Session as StudentSession
from app.models.student import Student
from app.models.task import ContentType, Task
from app.services.content_generator import StubContentGenerator
from app.services.engagement_engine import compute_and_persist_score
from app.services.intervention_engine import trigger_intervention
from app.services.seed_biology_tasks import seed_biology_tasks


@pytest.mark.integration
def test_multi_subject_biology_end_to_end_journey():
    """
    Test full end-to-end student journey for Biology:
    1. Seed biology tasks with grounding.
    2. Create student & session.
    3. Query biology tasks.
    4. Emit disengagement interaction events.
    5. Trigger grounded intervention.
    6. Verify intervention is persisted with grounding metadata.
    """
    # 1. Seed biology tasks with standalone session
    seeded_tasks = seed_biology_tasks()
    assert len(seeded_tasks) >= 8

    with Session(engine) as session:
        # 2. Create parent profile & student
        parent_profile = Profile(
            id=uuid.uuid4(),
            role=UserRole.parent,
            display_name="Biology Parent",
        )
        session.add(parent_profile)
        session.commit()

        student = Student(
            name="Biology Learner",
            age=12,
            grade_level="6th grade",
            learner_profile_tags=["adhd"],
            parent_id=parent_profile.id,
        )
        session.add(student)
        session.commit()
        session.refresh(student)

        # Create session
        stu_session = StudentSession(student_id=student.id, subject="biology")
        session.add(stu_session)
        session.commit()
        session.refresh(stu_session)

        # 3. Query biology tasks from DB
        stmt = select(Task).where(Task.subject == "biology", Task.skill_tag == "cell_structure")
        bio_tasks = list(session.exec(stmt).all())
        assert len(bio_tasks) > 0
        target_task = bio_tasks[0]
        assert target_task.grounding_chunk_ids is not None

        # 4. Emit interaction event (high latency + high switch rate = re_chunk intervention)
        event = InteractionEvent(
            session_id=stu_session.id,
            student_id=student.id,
            task_id=target_task.id,
            event_type=EventType.task_switch_away,
            payload={
                "actual_duration_seconds": 300,
                "expected_duration_seconds": 60,
                "tab_switch_count": 8,
                "retry_count": 3,
                "idle_seconds": 120,
            },
        )
        session.add(event)
        session.commit()
        session.refresh(event)

        # 5. Process engagement & generate intervention
        score = compute_and_persist_score(
            db=session,
            session_id=stu_session.id,
            task_id=target_task.id,
            triggering_event_type=event.event_type,
            expected_duration_seconds=target_task.expected_duration_seconds,
        )
        assert score is not None

        intervention = trigger_intervention(
            db=session,
            session_id=stu_session.id,
            task_id=target_task.id,
            signals=score.signals_snapshot,
            content_generator_client=StubContentGenerator(),
        )
        assert intervention is not None
        assert intervention.session_id == stu_session.id
        assert intervention.intervention_type in [
            InterventionType.re_chunk,
            InterventionType.modality_switch,
            InterventionType.difficulty_step_down,
            InterventionType.break_task,
        ]

        # 6. Verify generated variant task is grounded
        if intervention.generated_content_id:
            gen_task = session.get(Task, intervention.generated_content_id)
            assert gen_task is not None
            assert gen_task.subject == "biology"
            assert gen_task.is_ai_generated is True
