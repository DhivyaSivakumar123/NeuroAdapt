"""
Integration test configuration and fixtures.

Test DB strategy (documented in docs/decisions.md):
  Local Postgres via docker-compose.test.yml on port 5433.
  Run: docker-compose -f docker-compose.test.yml up -d
  Then: pytest tests/integration

The test DB is a clean Postgres instance. We apply the full schema via SQLModel's
create_all (not Alembic, for speed) at session start, then drop all tables at
session end.

RLS NOTE: The RLS policies reference auth.uid() which is a Supabase-specific function.
In the local test Postgres, auth.uid() does not exist. We handle this by:
  1. Skipping RLS policy creation in the test DB (schema applied via SQLModel create_all)
  2. Testing authorization logic via the backend's explicit role checks in deps.py
     and dashboard_service.py (defense-in-depth), not via Postgres RLS
  3. The RLS boundary tests (test_rls_role_boundaries.py) test the backend authorization
     layer, not the Postgres RLS layer — both layers enforce the same rules.

Auth strategy for tests:
  - generate_test_token() mints a JWT signed with TEST_JWT_SECRET
  - The FastAPI app's JWT verification is patched to use TEST_JWT_SECRET
  - Profiles are created directly in the DB (not via Supabase Auth)
"""

import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

from app.config import get_settings
from app.core.security import make_test_token
from app.deps import get_db
from app.main import app as fastapi_app
from app.models.profile import Profile, UserRole
from app.models.student import Student
from app.models.task import ContentType, Task

# ── Test configuration ────────────────────────────────────────────────────────
TEST_JWT_SECRET = "integration-test-secret-not-production"

settings = get_settings()
TEST_DB_URL = settings.test_database_url


# ── Engine and schema setup ───────────────────────────────────────────────────

@pytest.fixture(scope="session")
def test_engine():
    """Create the test DB engine once per test session. Requires PostgreSQL (no silent SQLite fallback)."""
    url = TEST_DB_URL
    if not url or "postgresql" not in url:
        pytest.exit("Integration tests require a PostgreSQL database. Set TEST_DATABASE_URL in .env.")

    try:
        engine = create_engine(url, echo=False)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        pytest.exit(f"PostgreSQL integration test database unreachable at {url}: {exc}")

    print(f"\n[INTEGRATION TESTS] Connected to PostgreSQL instance at: {url.split('@')[-1] if '@' in url else url}")

    import app.models  # noqa: F401

    with engine.connect() as conn:
        for enum_def in [
            "DO $$ BEGIN CREATE TYPE user_role AS ENUM ('student','parent','teacher'); EXCEPTION WHEN duplicate_object THEN null; END $$",
            "DO $$ BEGIN CREATE TYPE content_type AS ENUM ('text','interactive','visual'); EXCEPTION WHEN duplicate_object THEN null; END $$",
            "DO $$ BEGIN CREATE TYPE event_type AS ENUM ('task_start','task_switch_away','task_switch_back','answer_submit','retry','idle_ping','self_report','task_complete','task_abandon'); EXCEPTION WHEN duplicate_object THEN null; END $$",
            "DO $$ BEGIN CREATE TYPE intervention_type AS ENUM ('re_chunk','modality_switch','break_task','difficulty_step_down'); EXCEPTION WHEN duplicate_object THEN null; END $$",
            "DO $$ BEGIN CREATE TYPE intervention_outcome AS ENUM ('completed','abandoned_after','improved_score'); EXCEPTION WHEN duplicate_object THEN null; END $$",
        ]:
            conn.execute(text(enum_def))
        conn.commit()

    SQLModel.metadata.create_all(engine)

    yield engine

    engine.dispose()


@pytest.fixture
def db(test_engine) -> Generator[Session, None, None]:
    """
    Per-test DB session with automatic rollback.
    Each test gets a clean slate by rolling back any changes it made.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


# ── JWT and auth fixtures ─────────────────────────────────────────────────────

def make_profile(db: Session, role: UserRole, display_name: str = None) -> tuple[Profile, str]:
    """Create a profile in the test DB and return (profile, jwt_token)."""
    profile_id = uuid.uuid4()
    profile = Profile(
        id=profile_id,
        role=role,
        display_name=display_name or f"Test {role.value.capitalize()}",
    )
    db.add(profile)
    db.flush()  # Don't commit — let the test's rollback handle cleanup

    token = make_test_token(profile_id, TEST_JWT_SECRET)
    return profile, token


@pytest.fixture
def student_profile(db: Session) -> tuple[Profile, str]:
    return make_profile(db, UserRole.student, "Test Student")


@pytest.fixture
def parent_profile(db: Session) -> tuple[Profile, str]:
    return make_profile(db, UserRole.parent, "Test Parent")


@pytest.fixture
def teacher_profile(db: Session) -> tuple[Profile, str]:
    return make_profile(db, UserRole.teacher, "Test Teacher")


@pytest.fixture
def sample_student(db: Session, parent_profile) -> Student:
    """Create a sample student linked to the parent fixture."""
    parent, _ = parent_profile
    student = Student(
        name="Test Student Child",
        age=10,
        grade_level="4th grade",
        learner_profile_tags=["adhd"],
        parent_id=parent.id,
    )
    db.add(student)
    db.flush()
    return student


@pytest.fixture
def sample_task(db: Session) -> Task:
    """Create a sample Life Science task for tests."""
    task = Task(
        subject="life_science",
        skill_tag="cell_biology",
        difficulty_level=2,
        expected_duration_seconds=90,
        content_type=ContentType.interactive,
        content_body={
            "question": "What is the powerhouse of the cell?",
            "options": ["Nucleus", "Mitochondria", "Ribosome", "Vacuole"],
            "correct_index": 1,
        },
        prerequisite_task_ids=[],
        is_generated=False,
    )
    db.add(task)
    db.flush()
    return task


# ── HTTP client fixture ───────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def client(db: Session, monkeypatch) -> AsyncGenerator[AsyncClient, None]:
    """
    HTTP client against the FastAPI app, with:
    - DB session overridden to use the test DB (with rollback)
    - JWT verification patched to use TEST_JWT_SECRET
    """
    from app.core import security as sec
    from app import config as cfg

    # Patch JWT verification to use test secret
    monkeypatch.setattr(
        sec.get_settings(),
        "supabase_service_role_key",
        TEST_JWT_SECRET,
    )

    # Override the DB dependency
    def override_get_db():
        yield db

    fastapi_app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app),
        base_url="http://test",
    ) as ac:
        yield ac

    fastapi_app.dependency_overrides.clear()
