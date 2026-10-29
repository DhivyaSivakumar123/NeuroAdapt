"""
Unit tests for TaskService get_next_task logic.
"""

import uuid
from unittest.mock import MagicMock

from app.models.task import ContentType, Task
from app.services.task_service import get_next_task


def test_get_next_task_strict_subject_and_topic_filter():
    student_id = uuid.uuid4()
    session_id = uuid.uuid4()

    math_task = Task(
        id=uuid.uuid4(),
        subject="math",
        skill_tag="operations",
        difficulty_level=1,
        expected_duration_seconds=60,
        content_type=ContentType.text,
        content_body={"question": "What is 2 + 2?", "answer": "4"},
        is_generated=False,
    )

    db = MagicMock()
    # Student lookup returns None
    db.get.return_value = None

    # Exec calls:
    # 1. students by profile
    # 2. all sessions
    # 3. completed event task ids
    # 4. submit event payloads
    # 5. candidates matching subject & skill_tag
    mock_exec = MagicMock()
    mock_exec.all.side_effect = [
        [],  # students by profile
        [],  # sessions
        [],  # completed event task ids
        [],  # submit event payloads
        [math_task],  # candidates matching subject & skill_tag
    ]
    db.exec.return_value = mock_exec

    task = get_next_task(
        db=db,
        student_id=student_id,
        session_id=session_id,
        subject="math",
        skill_tag="operations",
    )

    assert task is not None
    assert task.id == math_task.id
    assert task.subject == "math"
    assert task.skill_tag == "operations"


def test_get_next_task_no_repetition_when_completed():
    student_id = uuid.uuid4()
    session_id = uuid.uuid4()

    task1_id = uuid.uuid4()
    task2_id = uuid.uuid4()

    task1 = Task(
        id=task1_id,
        subject="fractions",
        skill_tag="fractions",
        difficulty_level=1,
        expected_duration_seconds=60,
        content_type=ContentType.text,
        content_body={"question": "What is 1/2 + 1/2?", "answer": "1"},
        is_generated=False,
    )
    task2 = Task(
        id=task2_id,
        subject="fractions",
        skill_tag="fractions",
        difficulty_level=2,
        expected_duration_seconds=60,
        content_type=ContentType.text,
        content_body={"question": "What is 1/4 + 1/4?", "answer": "1/2"},
        is_generated=False,
    )

    db = MagicMock()
    db.get.return_value = None

    mock_exec = MagicMock()
    mock_exec.all.side_effect = [
        [],  # students by profile
        [session_id],  # all sessions
        [task1_id],  # completed event task ids
        [],  # submit event payloads
        [task1, task2],  # candidate tasks
    ]
    db.exec.return_value = mock_exec

    # Query for fractions topic
    task = get_next_task(
        db=db,
        student_id=student_id,
        session_id=session_id,
        subject="fractions",
        skill_tag="fractions",
    )

    # Task 1 was in completed_ids, so task 2 must be returned
    assert task is not None
    assert task.id == task2_id
    assert task.id != task1_id


def test_get_next_task_returns_none_when_all_completed():
    student_id = uuid.uuid4()
    session_id = uuid.uuid4()
    task1_id = uuid.uuid4()

    task1 = Task(
        id=task1_id,
        subject="biology",
        skill_tag="photosynthesis",
        difficulty_level=1,
        expected_duration_seconds=60,
        content_type=ContentType.text,
        content_body={"question": "What is photosynthesis?", "answer": "plant energy"},
        is_generated=False,
    )

    db = MagicMock()
    db.get.return_value = None

    mock_exec = MagicMock()
    mock_exec.all.side_effect = [
        [],  # students by profile
        [session_id],  # all sessions
        [task1_id],  # completed event task ids
        [],  # submit event payloads
        [task1],  # candidate tasks
    ]
    db.exec.return_value = mock_exec

    task = get_next_task(
        db=db,
        student_id=student_id,
        session_id=session_id,
        subject="biology",
        skill_tag="photosynthesis",
    )

    # All candidate tasks in the topic are completed, returns None
    assert task is None


def test_task_catalog_response_coercion():
    from app.schemas.task import TaskCatalogResponse, TaskResponse

    task_obj = Task(
        id=uuid.uuid4(),
        subject="math",
        skill_tag="algebra",
        difficulty_level=1,
        expected_duration_seconds=60,
        content_type=ContentType.text,
        content_body={"question": "2+2?"},
        prerequisite_task_ids=None,
        is_generated=None,
    )

    # Must validate without raising Pydantic ValidationError
    task_resp = TaskResponse.model_validate(task_obj)
    assert task_resp.prerequisite_task_ids == []
    assert task_resp.is_generated is False
    assert task_resp.parent_task_id is None

    catalog_resp = TaskCatalogResponse(
        tasks=[task_resp],
        subjects=["math"],
        skill_tags=["algebra"],
        total=1,
    )
    assert catalog_resp.total == 1
