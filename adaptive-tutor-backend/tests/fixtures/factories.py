"""
Test data factories — create test objects with sensible defaults.

Every integration test builds its scenario from these functions, not
hand-rolled inserts, so scenarios stay consistent and short to write.

Usage:
    from tests.fixtures.factories import make_student, make_task, make_session, make_event_sequence

    student = make_student(db, parent_id=parent.id)
    task = make_task(db, difficulty_level=3)
    session = make_session(db, student_id=student.id)
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session

from app.models.interaction_event import EventType, InteractionEvent
from app.models.session import Session as LearningSession
from app.models.student import Student
from app.models.task import ContentType, Task
from app.models.profile import Profile, UserRole


def make_student(
    db: Session,
    parent_id: uuid.UUID,
    name: str = "Test Student",
    age: int = 10,
    grade_level: str = "4th grade",
    learner_profile_tags: list[str] = None,
    profile_id: Optional[uuid.UUID] = None,
) -> Student:
    student = Student(
        name=name,
        age=age,
        grade_level=grade_level,
        learner_profile_tags=learner_profile_tags or ["adhd"],
        parent_id=parent_id,
        profile_id=profile_id,
    )
    db.add(student)
    db.flush()
    return student


def make_task(
    db: Session,
    subject: str = "life_science",
    skill_tag: str = "cell_biology",
    difficulty_level: int = 2,
    expected_duration_seconds: int = 90,
    content_type: ContentType = ContentType.interactive,
    content_body: dict = None,
    prerequisite_task_ids: list[uuid.UUID] = None,
    is_generated: bool = False,
) -> Task:
    if content_body is None:
        if content_type == ContentType.interactive:
            content_body = {
                "question": "What is the powerhouse of the cell?",
                "options": ["Nucleus", "Mitochondria", "Ribosome", "Vacuole"],
                "correct_index": 1,
            }
        elif content_type == ContentType.text:
            content_body = {
                "question": "What does the cell membrane do?",
                "answer": "controls what goes in and out",
                "hints": ["Think of cell skin"],
            }
        else:  # visual
            content_body = {
                "question": "What is labeled A in the diagram?",
                "image_description": "A simple cell diagram with A = nucleus",
                "answer": "nucleus",
            }

    task = Task(
        subject=subject,
        skill_tag=skill_tag,
        difficulty_level=difficulty_level,
        expected_duration_seconds=expected_duration_seconds,
        content_type=content_type,
        content_body=content_body,
        prerequisite_task_ids=prerequisite_task_ids or [],
        is_generated=is_generated,
    )
    db.add(task)
    db.flush()
    return task


def make_session(
    db: Session,
    student_id: uuid.UUID,
    started_at: Optional[datetime] = None,
) -> LearningSession:
    session = LearningSession(
        student_id=student_id,
        started_at=started_at or datetime.now(timezone.utc),
    )
    db.add(session)
    db.flush()
    return session


def make_event(
    db: Session,
    session_id: uuid.UUID,
    task_id: uuid.UUID,
    event_type: EventType,
    payload: dict = None,
    timestamp: Optional[datetime] = None,
) -> InteractionEvent:
    event = InteractionEvent(
        session_id=session_id,
        task_id=task_id,
        event_type=event_type,
        timestamp=timestamp or datetime.now(timezone.utc),
        payload=payload or {},
    )
    db.add(event)
    db.flush()
    return event


def make_engaged_event_sequence(
    db: Session,
    session_id: uuid.UUID,
    task_id: uuid.UUID,
) -> list[InteractionEvent]:
    """
    Create an event sequence representing an engaged student:
    task_start → answer_submit (correct) → self_report (5) → task_complete
    These should produce a low engagement_risk_score (< 0.4).
    """
    events = [
        make_event(db, session_id, task_id, EventType.task_start, {}),
        make_event(db, session_id, task_id, EventType.answer_submit,
                   {"correct": True, "answer_given": "Mitochondria"}),
        make_event(db, session_id, task_id, EventType.self_report, {"score": 5}),
        make_event(db, session_id, task_id, EventType.task_complete,
                   {"correct": True, "actual_duration_seconds": 70}),
    ]
    return events


def make_disengaged_event_sequence(
    db: Session,
    session_id: uuid.UUID,
    task_id: uuid.UUID,
) -> list[InteractionEvent]:
    """
    Create an event sequence representing a disengaged student:
    Multiple switches, negative self-report, abandonment.
    Should produce engagement_risk_score > 0.7.
    """
    events = [make_event(db, session_id, task_id, EventType.task_start, {})]

    # Multiple switches
    for _ in range(6):
        events.append(make_event(db, session_id, task_id, EventType.task_switch_away, {}))
        events.append(make_event(db, session_id, task_id, EventType.task_switch_back, {}))

    # Long idle
    events.append(make_event(db, session_id, task_id, EventType.idle_ping, {"idle_seconds": 120}))

    # Negative self-report
    events.append(make_event(db, session_id, task_id, EventType.self_report, {"score": 1}))

    # Abandon
    events.append(make_event(db, session_id, task_id, EventType.task_abandon, {}))

    return events
