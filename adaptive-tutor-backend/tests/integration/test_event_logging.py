"""
Integration tests: event logging — all 9 event types.
"""

import uuid
import pytest
from httpx import AsyncClient
from sqlmodel import Session, select

from app.models.interaction_event import InteractionEvent, EventType
from app.models.session import Session as LearningSession


class TestEventLogging:
    async def _start_session(self, client: AsyncClient, student_id: uuid.UUID, token: str) -> uuid.UUID:
        resp = await client.post(
            "/sessions",
            json={"student_id": str(student_id)},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        return uuid.UUID(resp.json()["id"])

    async def test_task_start_event(
        self, client: AsyncClient, db: Session, sample_student, sample_task, parent_profile
    ):
        parent, token = parent_profile
        session_id = await self._start_session(client, sample_student.id, token)

        resp = await client.post(
            "/events",
            json={
                "session_id": str(session_id),
                "task_id": str(sample_task.id),
                "payload": {"event_type": "task_start"},
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["event_type"] == "task_start"

    async def test_all_9_event_types_accepted(
        self, client: AsyncClient, db: Session, sample_student, sample_task, parent_profile
    ):
        parent, token = parent_profile
        session_id = await self._start_session(client, sample_student.id, token)

        payloads = [
            {"event_type": "task_start"},
            {"event_type": "task_switch_away"},
            {"event_type": "task_switch_back"},
            {"event_type": "answer_submit", "correct": True, "answer_given": "mitochondria"},
            {"event_type": "retry", "attempt_number": 1},
            {"event_type": "idle_ping", "idle_seconds": 15},
            {"event_type": "self_report", "score": 4},
            {"event_type": "task_complete", "correct": True, "actual_duration_seconds": 85},
            {"event_type": "task_abandon"},
        ]

        for payload in payloads:
            resp = await client.post(
                "/events",
                json={
                    "session_id": str(session_id),
                    "task_id": str(sample_task.id),
                    "payload": payload,
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 201, f"Failed for payload: {payload}"
            assert resp.json()["event_type"] == payload["event_type"]

    async def test_invalid_event_type_returns_422(
        self, client: AsyncClient, db, sample_student, sample_task, parent_profile
    ):
        parent, token = parent_profile
        session_id = await self._start_session(client, sample_student.id, token)

        resp = await client.post(
            "/events",
            json={
                "session_id": str(session_id),
                "task_id": str(sample_task.id),
                "payload": {"event_type": "made_up_event"},
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 422

    async def test_malformed_payload_returns_422(
        self, client: AsyncClient, db, sample_student, sample_task, parent_profile
    ):
        """self_report without score → 422 (required field missing)."""
        parent, token = parent_profile
        session_id = await self._start_session(client, sample_student.id, token)

        resp = await client.post(
            "/events",
            json={
                "session_id": str(session_id),
                "task_id": str(sample_task.id),
                "payload": {"event_type": "self_report"},  # missing score
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 422

    async def test_nonexistent_session_returns_404(
        self, client: AsyncClient, sample_task, parent_profile
    ):
        parent, token = parent_profile
        resp = await client.post(
            "/events",
            json={
                "session_id": str(uuid.uuid4()),  # doesn't exist
                "task_id": str(sample_task.id),
                "payload": {"event_type": "task_start"},
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 404
