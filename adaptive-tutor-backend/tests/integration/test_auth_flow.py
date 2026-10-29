"""
Integration tests: auth flow.

Tests that protected routes enforce JWT auth correctly.
"""

import pytest
from httpx import AsyncClient

from tests.integration.conftest import make_profile, TEST_JWT_SECRET
from app.models.profile import UserRole
from app.core.security import make_test_token
import uuid


class TestAuthFlow:
    async def test_health_check_no_auth_required(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    async def test_protected_route_requires_token(self, client: AsyncClient):
        """No auth header → 403 (FastAPI HTTPBearer returns 403 when no header)."""
        resp = await client.get("/auth/me")
        assert resp.status_code in (401, 403)

    async def test_invalid_token_returns_401(self, client: AsyncClient):
        resp = await client.get(
            "/auth/me",
            headers={"Authorization": "Bearer this.is.invalid"},
        )
        assert resp.status_code == 401

    async def test_valid_token_returns_profile(self, client: AsyncClient, db, student_profile):
        profile, token = student_profile
        resp = await client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == str(profile.id)
        assert data["role"] == "student"

    async def test_create_profile_endpoint(self, client: AsyncClient):
        """POST /auth/profile creates a new profile without requiring auth."""
        new_id = uuid.uuid4()
        resp = await client.post(
            "/auth/profile",
            json={
                "id": str(new_id),
                "role": "parent",
                "display_name": "New Parent",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["role"] == "parent"
        assert data["display_name"] == "New Parent"

    async def test_create_profile_is_idempotent(self, client: AsyncClient, db, student_profile):
        profile, _ = student_profile
        db.commit()
        resp = await client.post(
            "/auth/profile",
            json={
                "id": str(profile.id),
                "role": "student",
                "display_name": "Duplicate",
            },
        )
        assert resp.status_code in (200, 201)
        assert resp.json()["display_name"] == "Duplicate"
