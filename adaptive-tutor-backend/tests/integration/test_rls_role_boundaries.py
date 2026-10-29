"""
Integration tests: RLS and role boundary enforcement.

These are EXPLICIT NEGATIVE TESTS — the primary goal is to confirm that
one role cannot access another role's data. Per day-01-backend-plan.md §6.2,
these tests are in a separate file to avoid having boundary failures masked by
happy-path tests.

Tests:
  - Parent cannot access another parent's student data
  - Student cannot access teacher endpoints  
  - Teacher can only access their assigned students (not all students)
  - Parent can only access their own children (not others')
"""

import uuid
import pytest
from httpx import AsyncClient
from sqlmodel import Session

from app.models.profile import UserRole
from app.models.student import Student
from app.models.student_teacher import StudentTeacher
from tests.integration.conftest import make_profile


class TestRLSRoleBoundaries:
    async def _start_session(self, client: AsyncClient, student_id: uuid.UUID, token: str) -> uuid.UUID:
        resp = await client.post(
            "/sessions",
            json={"student_id": str(student_id)},
            headers={"Authorization": f"Bearer {token}"},
        )
        return uuid.UUID(resp.json()["id"]) if resp.status_code == 201 else None

    async def test_student_cannot_access_dashboard(
        self, client: AsyncClient, db: Session, sample_student, student_profile
    ):
        """Student role cannot call dashboard endpoints (parent/teacher only)."""
        _, student_token = student_profile
        resp = await client.get(
            "/dashboard/flags",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert resp.status_code == 403

    async def test_parent_cannot_see_other_parents_students(
        self, client: AsyncClient, db: Session, sample_student, parent_profile
    ):
        """
        Parent A cannot see Parent B's student's engagement data.
        sample_student belongs to parent_profile (Parent A).
        We create Parent B and verify they get empty/forbidden results.
        """
        parent_a, token_a = parent_profile

        # Create Parent B
        parent_b, token_b = make_profile(db, UserRole.parent, "Parent B")

        # Create a session under Parent A's student
        session_id = await self._start_session(client, sample_student.id, token_a)
        assert session_id is not None

        # Parent B tries to access engagement data for Parent A's student
        resp = await client.get(
            f"/dashboard/students/{sample_student.id}/engagement",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        # Deterministic behavior: returns HTTP 403 Forbidden (access denied)
        assert resp.status_code == 403
        assert "Access denied" in resp.json()["detail"]

    async def test_teacher_cannot_see_unassigned_students(
        self, client: AsyncClient, db: Session, sample_student, teacher_profile
    ):
        """Teacher without an assignment cannot see a student's engagement data."""
        teacher, teacher_token = teacher_profile

        # Teacher is NOT in student_teacher for sample_student
        resp = await client.get(
            f"/dashboard/students/{sample_student.id}/engagement",
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        # Deterministic behavior: returns HTTP 403 Forbidden (access denied)
        assert resp.status_code == 403
        assert "Access denied" in resp.json()["detail"]

    async def test_teacher_can_see_assigned_students(
        self, client: AsyncClient, db: Session, sample_student, teacher_profile, parent_profile
    ):
        """Teacher WITH an assignment CAN see the student's data."""
        teacher, teacher_token = teacher_profile
        parent, parent_token = parent_profile

        # Create the student_teacher assignment
        assignment = StudentTeacher(
            student_id=sample_student.id,
            teacher_id=teacher.id,
        )
        db.add(assignment)
        db.flush()

        # Now teacher should be able to access
        resp = await client.get(
            f"/dashboard/students/{sample_student.id}/engagement",
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        assert resp.status_code == 200

    async def test_parent_can_start_session_for_own_child(
        self, client: AsyncClient, db: Session, sample_student, parent_profile
    ):
        parent, token = parent_profile
        resp = await client.post(
            "/sessions",
            json={"student_id": str(sample_student.id)},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201

    async def test_other_parent_cannot_start_session_for_unrelated_student(
        self, client: AsyncClient, db: Session, sample_student, parent_profile
    ):
        """Parent B cannot start a session for Parent A's student."""
        parent_b, token_b = make_profile(db, UserRole.parent, "Parent B Unauthorized")

        resp = await client.post(
            "/sessions",
            json={"student_id": str(sample_student.id)},
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp.status_code == 403
