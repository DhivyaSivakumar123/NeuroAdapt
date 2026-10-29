"""
Integration tests: intervention triggering end-to-end.
Uses /interventions/simulate to force interventions without manufacturing 20+ events.
"""

from datetime import datetime, timedelta, timezone
import uuid
import pytest
from httpx import AsyncClient
from sqlmodel import Session, select

from app.models.intervention import Intervention, InterventionOutcome, InterventionType


class TestInterventionsE2E:
    async def _start_session(self, client: AsyncClient, student_id: uuid.UUID, token: str) -> uuid.UUID:
        resp = await client.post(
            "/sessions",
            json={"student_id": str(student_id)},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        return uuid.UUID(resp.json()["id"])

    async def test_simulate_endpoint_accessible(
        self, client: AsyncClient, db: Session, sample_student, sample_task, parent_profile
    ):
        parent, token = parent_profile
        session_id = await self._start_session(client, sample_student.id, token)

        # Start the task first (intervention requires a task record)
        await client.post(
            "/events",
            json={
                "session_id": str(session_id),
                "task_id": str(sample_task.id),
                "payload": {"event_type": "task_start"},
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        resp = await client.post(
            "/interventions/simulate",
            json={
                "session_id": str(session_id),
                "task_id": str(sample_task.id),
                "signals": {
                    "normalized_latency_ratio": 0.9,
                    "normalized_switch_rate": 0.8,
                    "abandonment_flag": 0.0,
                },
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "intervention_type" in data
        assert data["outcome"] is None  # not yet resolved

    async def test_simulate_all_four_intervention_types(
        self, client: AsyncClient, db: Session, sample_student, sample_task, parent_profile
    ):
        parent, token = parent_profile

        for intervention_type in ["re_chunk", "modality_switch", "break_task", "difficulty_step_down"]:
            session_id = await self._start_session(client, sample_student.id, token)

            await client.post(
                "/events",
                json={
                    "session_id": str(session_id),
                    "task_id": str(sample_task.id),
                    "payload": {"event_type": "task_start"},
                },
                headers={"Authorization": f"Bearer {token}"},
            )

            resp = await client.post(
                "/interventions/simulate",
                json={
                    "session_id": str(session_id),
                    "task_id": str(sample_task.id),
                    "signals": {"normalized_latency_ratio": 0.5},
                    "force_type": intervention_type,
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 201, f"Failed for type {intervention_type}: {resp.text}"
            data = resp.json()
            assert data["intervention_type"] == intervention_type

    async def test_outcome_update(
        self, client: AsyncClient, db: Session, sample_student, sample_task, parent_profile
    ):
        parent, token = parent_profile
        session_id = await self._start_session(client, sample_student.id, token)

        await client.post(
            "/events",
            json={
                "session_id": str(session_id),
                "task_id": str(sample_task.id),
                "payload": {"event_type": "task_start"},
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        # Create intervention
        resp = await client.post(
            "/interventions/simulate",
            json={
                "session_id": str(session_id),
                "task_id": str(sample_task.id),
                "signals": {},
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        intervention_id = resp.json()["id"]

        # Update outcome
        resp = await client.patch(
            f"/interventions/{intervention_id}/outcome",
            json={"outcome": "completed"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["outcome"] == "completed"

    async def test_list_interventions_for_session(
        self, client: AsyncClient, db: Session, sample_student, sample_task, parent_profile
    ):
        parent, token = parent_profile
        session_id = await self._start_session(client, sample_student.id, token)

        await client.post(
            "/events",
            json={
                "session_id": str(session_id),
                "task_id": str(sample_task.id),
                "payload": {"event_type": "task_start"},
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        await client.post(
            "/interventions/simulate",
            json={
                "session_id": str(session_id),
                "task_id": str(sample_task.id),
                "signals": {},
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        resp = await client.get(
            f"/interventions/{session_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 1

    async def test_auto_trigger_without_simulate_route(
        self, client: AsyncClient, db: Session, sample_student, sample_task, parent_profile
    ):
        """
        PROVE intervention auto-triggering end-to-end WITHOUT calling /interventions/simulate.
        Posting high-disengagement events (switches + abandon) via POST /events
        automatically computes engagement score (>0.7) AND creates an intervention row.
        """
        parent, token = parent_profile
        session_id = await self._start_session(client, sample_student.id, token)

        from datetime import timedelta
        past_time = (datetime.now(timezone.utc) - timedelta(minutes=3)).isoformat()

        # 1. Log task start 3 minutes ago (high latency)
        await client.post(
            "/events",
            json={
                "session_id": str(session_id),
                "task_id": str(sample_task.id),
                "timestamp": past_time,
                "payload": {"event_type": "task_start"},
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        # 2. Log 10 switch events + negative self report
        for _ in range(10):
            await client.post(
                "/events",
                json={
                    "session_id": str(session_id),
                    "task_id": str(sample_task.id),
                    "payload": {"event_type": "task_switch_away"},
                },
                headers={"Authorization": f"Bearer {token}"},
            )

        # Log negative self-report (score = 1 -> max disengagement)
        await client.post(
            "/events",
            json={
                "session_id": str(session_id),
                "task_id": str(sample_task.id),
                "payload": {"event_type": "self_report", "score": 1},
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        # 3. Log task_abandon (triggers score computation + intervention trigger inline)
        abandon_resp = await client.post(
            "/events",
            json={
                "session_id": str(session_id),
                "task_id": str(sample_task.id),
                "payload": {"event_type": "task_abandon"},
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert abandon_resp.status_code == 201

        # 4. Verify intervention was automatically created in database and is queryable
        list_resp = await client.get(
            f"/interventions/{session_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert list_resp.status_code == 200
        interventions = list_resp.json()
        assert len(interventions) >= 1, "Intervention should be automatically triggered without /simulate"
        latest = interventions[-1]
        assert latest["session_id"] == str(session_id)
        assert latest["task_id"] == str(sample_task.id)
        assert latest["intervention_type"] in ["break_task", "re_chunk", "modality_switch", "difficulty_step_down"]
        assert latest["outcome"] is None

