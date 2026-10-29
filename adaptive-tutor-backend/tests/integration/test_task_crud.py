"""Integration tests: task CRUD and next-task sequencing."""

import uuid
import pytest
from httpx import AsyncClient
from sqlmodel import Session

from app.models.task import ContentType, Task


class TestTaskCRUD:
    async def test_list_tasks_authenticated(
        self, client: AsyncClient, sample_task, parent_profile
    ):
        _, token = parent_profile
        resp = await client.get(
            "/tasks",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_tasks_unauthenticated_returns_401(self, client: AsyncClient):
        resp = await client.get("/tasks")
        assert resp.status_code == 401

    async def test_get_task_by_id(
        self, client: AsyncClient, sample_task, parent_profile
    ):
        _, token = parent_profile
        resp = await client.get(
            f"/tasks/{sample_task.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == str(sample_task.id)
        assert data["skill_tag"] == "cell_biology"

    async def test_get_nonexistent_task_returns_404(
        self, client: AsyncClient, parent_profile
    ):
        _, token = parent_profile
        resp = await client.get(
            f"/tasks/{uuid.uuid4()}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 404

    async def test_submit_answer_correct(
        self, client: AsyncClient, db: Session, sample_task, sample_student, parent_profile
    ):
        _, token = parent_profile
        # The correct answer for our interactive task is options[1] = "Mitochondria"
        resp = await client.post(
            f"/tasks/{sample_task.id}/submit",
            json={
                "answer": "Mitochondria",
                "session_id": str(uuid.uuid4()),  # session_id exists but not validated deeply here
                "actual_duration_seconds": 60,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["correct"] is True

    async def test_submit_answer_incorrect(
        self, client: AsyncClient, sample_task, parent_profile
    ):
        _, token = parent_profile
        resp = await client.post(
            f"/tasks/{sample_task.id}/submit",
            json={
                "answer": "Nucleus",  # wrong answer
                "session_id": str(uuid.uuid4()),
                "actual_duration_seconds": 45,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["correct"] is False

    async def test_filter_by_skill_tag(
        self, client: AsyncClient, db: Session, sample_task, parent_profile
    ):
        _, token = parent_profile
        resp = await client.get(
            "/tasks?skill_tag=cell_biology",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        tasks = resp.json()
        assert all(t["skill_tag"] == "cell_biology" for t in tasks)


class TestSessionLifecycle:
    async def test_start_and_end_session(
        self, client: AsyncClient, sample_student, parent_profile
    ):
        _, token = parent_profile

        # Start session
        resp = await client.post(
            "/sessions",
            json={"student_id": str(sample_student.id)},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        session_id = resp.json()["id"]
        assert resp.json()["ended_at"] is None

        # End session
        resp = await client.patch(
            f"/sessions/{session_id}/end",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["ended_at"] is not None

    async def test_end_already_ended_session_returns_409(
        self, client: AsyncClient, sample_student, parent_profile
    ):
        _, token = parent_profile
        resp = await client.post(
            "/sessions",
            json={"student_id": str(sample_student.id)},
            headers={"Authorization": f"Bearer {token}"},
        )
        session_id = resp.json()["id"]

        await client.patch(
            f"/sessions/{session_id}/end",
            headers={"Authorization": f"Bearer {token}"},
        )

        # Try to end again
        resp = await client.patch(
            f"/sessions/{session_id}/end",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 409
