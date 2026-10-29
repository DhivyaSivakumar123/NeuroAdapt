"""Integration tests: dashboard access — correct data returned per role."""

import pytest
from httpx import AsyncClient
from sqlmodel import Session

from app.models.student_teacher import StudentTeacher


class TestDashboardAccess:
    async def test_parent_dashboard_flags_accessible(
        self, client: AsyncClient, sample_student, parent_profile
    ):
        _, token = parent_profile
        resp = await client.get(
            "/dashboard/flags",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert "flagged" in resp.json()

    async def test_teacher_dashboard_flags_accessible(
        self, client: AsyncClient, teacher_profile
    ):
        _, token = teacher_profile
        resp = await client.get(
            "/dashboard/flags",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

    async def test_student_cannot_access_dashboard_flags(
        self, client: AsyncClient, student_profile
    ):
        _, token = student_profile
        resp = await client.get(
            "/dashboard/flags",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    async def test_parent_sees_own_student_engagement(
        self, client: AsyncClient, db: Session, sample_student, parent_profile
    ):
        _, token = parent_profile
        resp = await client.get(
            f"/dashboard/students/{sample_student.id}/engagement",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["student_id"] == str(sample_student.id)

    async def test_teacher_sees_assigned_student(
        self, client: AsyncClient, db: Session, sample_student, teacher_profile
    ):
        teacher, teacher_token = teacher_profile

        # Assign teacher to student
        db.add(StudentTeacher(student_id=sample_student.id, teacher_id=teacher.id))
        db.flush()

        resp = await client.get(
            f"/dashboard/students/{sample_student.id}/engagement",
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        assert resp.status_code == 200
