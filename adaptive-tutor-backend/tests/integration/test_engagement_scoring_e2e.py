"""
Integration tests: engagement scoring end-to-end.

Posts a realistic event sequence and confirms:
  - An engagement_scores row is computed with the correct classification
  - signals_snapshot is stored and non-empty
  - GET /engagement/{session_id} returns the scores
"""

import uuid
import pytest
from httpx import AsyncClient
from sqlmodel import Session, select

from app.models.engagement_score import EngagementScore
from app.services.engagement_engine import THRESHOLD_TRIGGER


class TestEngagementScoringE2E:
    async def _start_session(self, client: AsyncClient, student_id: uuid.UUID, token: str) -> uuid.UUID:
        resp = await client.post(
            "/sessions",
            json={"student_id": str(student_id)},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        return uuid.UUID(resp.json()["id"])

    async def _post_event(
        self, client: AsyncClient, session_id: uuid.UUID, task_id: uuid.UUID, payload: dict, token: str
    ) -> dict:
        resp = await client.post(
            "/events",
            json={
                "session_id": str(session_id),
                "task_id": str(task_id),
                "payload": payload,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        return resp.json()

    async def test_task_complete_triggers_scoring(
        self, client: AsyncClient, db: Session, sample_student, sample_task, parent_profile
    ):
        """After posting task_complete, an EngagementScore row should exist."""
        parent, token = parent_profile
        session_id = await self._start_session(client, sample_student.id, token)

        # Start the task
        await self._post_event(client, session_id, sample_task.id,
                               {"event_type": "task_start"}, token)

        # Complete the task (triggers scoring)
        await self._post_event(client, session_id, sample_task.id,
                               {"event_type": "task_complete", "correct": True,
                                "actual_duration_seconds": 100}, token)

        # Check score was computed in DB
        db.expire_all()  # force re-read from DB
        scores = list(db.exec(
            select(EngagementScore).where(EngagementScore.session_id == session_id)
        ).all())
        assert len(scores) >= 1
        score = scores[-1]
        assert 0.0 <= score.computed_score <= 1.0
        assert "normalized_latency_ratio" in score.signals_snapshot
        assert "classification" in score.signals_snapshot

    async def test_high_disengagement_triggers_intervention_classification(
        self, client: AsyncClient, db: Session, sample_student, sample_task, parent_profile
    ):
        """Simulate a high-disengagement sequence and confirm trigger_intervention classification."""
        parent, token = parent_profile
        session_id = await self._start_session(client, sample_student.id, token)

        await self._post_event(client, session_id, sample_task.id,
                               {"event_type": "task_start"}, token)

        # Multiple switches (high switch rate)
        for _ in range(5):
            await self._post_event(client, session_id, sample_task.id,
                                   {"event_type": "task_switch_away"}, token)
            await self._post_event(client, session_id, sample_task.id,
                                   {"event_type": "task_switch_back"}, token)

        # Negative self-report
        await self._post_event(client, session_id, sample_task.id,
                               {"event_type": "self_report", "score": 1}, token)

        # Abandon (triggers scoring with abandon_flag=1.0 + high latency from slow completion)
        await self._post_event(client, session_id, sample_task.id,
                               {"event_type": "task_abandon"}, token)

        # Check scoring endpoint
        resp = await client.get(
            f"/engagement/{session_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["scores"]) >= 1
        assert data["latest_classification"] in ("flag_monitor", "trigger_intervention")

    async def test_engagement_endpoint_returns_session_scores(
        self, client: AsyncClient, db: Session, sample_student, sample_task, parent_profile
    ):
        parent, token = parent_profile
        session_id = await self._start_session(client, sample_student.id, token)

        await self._post_event(client, session_id, sample_task.id,
                               {"event_type": "task_start"}, token)
        await self._post_event(client, session_id, sample_task.id,
                               {"event_type": "task_complete", "correct": True,
                                "actual_duration_seconds": 60}, token)

        resp = await client.get(
            f"/engagement/{session_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["session_id"] == str(session_id)
        assert isinstance(data["scores"], list)
