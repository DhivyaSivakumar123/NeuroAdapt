"""Unit tests for Meeting router and CRUD operations."""

import uuid
from datetime import date
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.deps import get_db, get_current_user
from app.models.profile import Profile, UserRole
from app.models.meeting import Meeting
from sqlmodel import SQLModel


# In-memory SQLite for testing
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Meeting.__table__.create(bind=engine, checkfirst=True)
    yield
    Meeting.__table__.drop(bind=engine, checkfirst=True)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


teacher_profile = Profile(
    id="teacher-uuid-1",
    email="teacher@test.com",
    role=UserRole.teacher,
    display_name="Teacher Alex",
)

student_profile = Profile(
    id="student-uuid-1",
    email="student@test.com",
    role=UserRole.student,
    display_name="Student Sam",
)


def test_create_and_list_meetings():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: teacher_profile

    client = TestClient(app)

    # 1. Create a meeting as teacher
    payload = {
        "title": "Physics SSC Revision Class",
        "subject": "Physics",
        "meeting_link": "meet.google.com/abc-defg-hij",
        "meeting_date": str(date.today()),
        "start_time": "01:00 PM",
        "end_time": "02:00 PM",
        "status": "upcoming",
        "description": "Covering Newton's Laws and Kinematics",
    }

    res = client.post("/meetings", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Physics SSC Revision Class"
    assert data["meeting_link"] == "https://meet.google.com/abc-defg-hij"
    assert data["teacher_id"] == "teacher-uuid-1"
    meeting_id = data["id"]

    # 2. List meetings as student
    app.dependency_overrides[get_current_user] = lambda: student_profile
    res_list = client.get("/meetings")
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] >= 1
    assert any(m["id"] == meeting_id for m in list_data["meetings"])

    # 3. Update meeting as teacher
    app.dependency_overrides[get_current_user] = lambda: teacher_profile
    res_update = client.put(f"/meetings/{meeting_id}", json={"status": "live"})
    assert res_update.status_code == 200
    assert res_update.json()["status"] == "live"

    # 4. Delete meeting as teacher
    res_del = client.delete(f"/meetings/{meeting_id}")
    assert res_del.status_code == 204

    # Cleanup overrides
    app.dependency_overrides.clear()
