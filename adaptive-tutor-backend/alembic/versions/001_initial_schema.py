"""Initial schema: all tables, enums, indexes, RLS policies.

Revision ID: 001
Revises:
Create Date: 2026-08-28 00:00:00.000000

This migration creates the complete initial schema including:
- All 5 native Postgres enum types
- All 8 application tables
- Indexes for frequently-queried FK columns
- Row-Level Security (RLS) enabled on the 5 tables containing student data
- 3 role-based RLS policies (student / parent / teacher access scopes)

RLS NOTE: The policies reference auth.uid() — this is Supabase's built-in function
that returns the UUID of the currently authenticated user. When running against
the local test DB (Docker Postgres, no Supabase), these policies are created but
auth.uid() will always return null; integration tests bypass RLS using the
service-role connection (SET row_security = off) or by setting a session variable.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Create enum types ──────────────────────────────────────────────────
    op.execute("DO $$ BEGIN CREATE TYPE user_role AS ENUM ('student', 'parent', 'teacher'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE content_type AS ENUM ('text', 'interactive', 'visual'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute(
        "DO $$ BEGIN CREATE TYPE event_type AS ENUM ("
        "'task_start', 'task_switch_away', 'task_switch_back', 'answer_submit',"
        "'retry', 'idle_ping', 'self_report', 'task_complete', 'task_abandon'"
        "); EXCEPTION WHEN duplicate_object THEN null; END $$;"
    )
    op.execute(
        "DO $$ BEGIN CREATE TYPE intervention_type AS ENUM ("
        "'re_chunk', 'modality_switch', 'break_task', 'difficulty_step_down'"
        "); EXCEPTION WHEN duplicate_object THEN null; END $$;"
    )
    op.execute(
        "DO $$ BEGIN CREATE TYPE intervention_outcome AS ENUM ("
        "'completed', 'abandoned_after', 'improved_score'"
        "); EXCEPTION WHEN duplicate_object THEN null; END $$;"
    )

    # ── 2. profiles ───────────────────────────────────────────────────────────
    op.create_table(
        "profiles",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "role",
            sa.dialects.postgresql.ENUM("student", "parent", "teacher", name="user_role", create_type=False),
            nullable=False,
        ),
        sa.Column("display_name", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ── 3. students ───────────────────────────────────────────────────────────
    op.create_table(
        "students",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "profile_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("age", sa.Integer, nullable=False),
        sa.Column("grade_level", sa.String(50), nullable=False),
        sa.Column(
            "learner_profile_tags",
            sa.ARRAY(sa.Text),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "parent_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("profiles.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_students_parent_id", "students", ["parent_id"])

    # ── 4. student_teacher ────────────────────────────────────────────────────
    op.create_table(
        "student_teacher",
        sa.Column(
            "student_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "teacher_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("profiles.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
    )
    op.create_index("ix_student_teacher_teacher_id", "student_teacher", ["teacher_id"])

    # ── 5. tasks ──────────────────────────────────────────────────────────────
    op.create_table(
        "tasks",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("subject", sa.String(100), nullable=False),
        sa.Column("skill_tag", sa.String(100), nullable=False),
        sa.Column("difficulty_level", sa.Integer, nullable=False),
        sa.Column("expected_duration_seconds", sa.Integer, nullable=False),
        sa.Column(
            "content_type",
            sa.dialects.postgresql.ENUM("text", "interactive", "visual", name="content_type", create_type=False),
            nullable=False,
        ),
        sa.Column("content_body", sa.dialects.postgresql.JSONB, nullable=False),
        sa.Column(
            "prerequisite_task_ids",
            sa.ARRAY(sa.UUID(as_uuid=True)),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "is_generated",
            sa.Boolean,
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "parent_task_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_tasks_subject_skill", "tasks", ["subject", "skill_tag"])
    op.create_index("ix_tasks_difficulty", "tasks", ["difficulty_level"])

    # ── 6. sessions ───────────────────────────────────────────────────────────
    op.create_table(
        "sessions",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "student_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_sessions_student_id", "sessions", ["student_id"])

    # ── 7. interaction_events ─────────────────────────────────────────────────
    op.create_table(
        "interaction_events",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "session_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "task_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "event_type",
            sa.dialects.postgresql.ENUM(
                "task_start", "task_switch_away", "task_switch_back", "answer_submit",
                "retry", "idle_ping", "self_report", "task_complete", "task_abandon",
                name="event_type",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("payload", sa.dialects.postgresql.JSONB, nullable=False),
    )
    op.create_index("ix_interaction_events_session_id", "interaction_events", ["session_id"])
    op.create_index("ix_interaction_events_task_id", "interaction_events", ["task_id"])
    op.create_index("ix_interaction_events_timestamp", "interaction_events", ["timestamp"])

    # ── 8. engagement_scores ──────────────────────────────────────────────────
    op.create_table(
        "engagement_scores",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "session_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "task_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("computed_score", sa.Float, nullable=False),
        sa.Column(
            "computed_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("signals_snapshot", sa.dialects.postgresql.JSONB, nullable=False),
    )
    op.create_index("ix_engagement_scores_session_id", "engagement_scores", ["session_id"])
    op.create_index("ix_engagement_scores_task_id", "engagement_scores", ["task_id"])

    # ── 9. interventions ──────────────────────────────────────────────────────
    op.create_table(
        "interventions",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "session_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "task_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "intervention_type",
            sa.dialects.postgresql.ENUM(
                "re_chunk", "modality_switch", "break_task", "difficulty_step_down",
                name="intervention_type",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "triggered_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "outcome",
            sa.dialects.postgresql.ENUM(
                "completed", "abandoned_after", "improved_score",
                name="intervention_outcome",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column(
            "generated_content_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_interventions_session_id", "interventions", ["session_id"])

    # ── 10. Row-Level Security ─────────────────────────────────────────────────
    # Enable RLS on all tables containing student data.
    for table in ["students", "sessions", "interaction_events", "engagement_scores", "interventions"]:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")

    # ── Student policies: can only access their own data ──────────────────────
    # Student accesses sessions where the session's student maps to their profile.
    op.execute("""
        CREATE POLICY student_own_sessions ON sessions
        FOR ALL
        TO authenticated
        USING (
            student_id IN (
                SELECT id FROM students WHERE profile_id = auth.uid()
            )
        )
        WITH CHECK (
            student_id IN (
                SELECT id FROM students WHERE profile_id = auth.uid()
            )
        )
    """)
    op.execute("""
        CREATE POLICY student_own_interaction_events ON interaction_events
        FOR ALL
        TO authenticated
        USING (
            session_id IN (
                SELECT s.id FROM sessions s
                JOIN students st ON st.id = s.student_id
                WHERE st.profile_id = auth.uid()
            )
        )
        WITH CHECK (
            session_id IN (
                SELECT s.id FROM sessions s
                JOIN students st ON st.id = s.student_id
                WHERE st.profile_id = auth.uid()
            )
        )
    """)
    op.execute("""
        CREATE POLICY student_own_engagement_scores ON engagement_scores
        FOR SELECT
        TO authenticated
        USING (
            session_id IN (
                SELECT s.id FROM sessions s
                JOIN students st ON st.id = s.student_id
                WHERE st.profile_id = auth.uid()
            )
        )
    """)
    op.execute("""
        CREATE POLICY student_own_interventions ON interventions
        FOR SELECT
        TO authenticated
        USING (
            session_id IN (
                SELECT s.id FROM sessions s
                JOIN students st ON st.id = s.student_id
                WHERE st.profile_id = auth.uid()
            )
        )
    """)
    op.execute("""
        CREATE POLICY student_own_students ON students
        FOR SELECT
        TO authenticated
        USING (profile_id = auth.uid())
    """)

    # ── Parent policies: can access data for their linked students ────────────
    op.execute("""
        CREATE POLICY parent_students ON students
        FOR SELECT
        TO authenticated
        USING (parent_id = auth.uid())
    """)
    op.execute("""
        CREATE POLICY parent_sessions ON sessions
        FOR SELECT
        TO authenticated
        USING (
            student_id IN (
                SELECT id FROM students WHERE parent_id = auth.uid()
            )
        )
    """)
    op.execute("""
        CREATE POLICY parent_interaction_events ON interaction_events
        FOR SELECT
        TO authenticated
        USING (
            session_id IN (
                SELECT s.id FROM sessions s
                JOIN students st ON st.id = s.student_id
                WHERE st.parent_id = auth.uid()
            )
        )
    """)
    op.execute("""
        CREATE POLICY parent_engagement_scores ON engagement_scores
        FOR SELECT
        TO authenticated
        USING (
            session_id IN (
                SELECT s.id FROM sessions s
                JOIN students st ON st.id = s.student_id
                WHERE st.parent_id = auth.uid()
            )
        )
    """)
    op.execute("""
        CREATE POLICY parent_interventions ON interventions
        FOR SELECT
        TO authenticated
        USING (
            session_id IN (
                SELECT s.id FROM sessions s
                JOIN students st ON st.id = s.student_id
                WHERE st.parent_id = auth.uid()
            )
        )
    """)

    # ── Teacher policies: can access data for their assigned students ─────────
    op.execute("""
        CREATE POLICY teacher_students ON students
        FOR SELECT
        TO authenticated
        USING (
            id IN (
                SELECT student_id FROM student_teacher WHERE teacher_id = auth.uid()
            )
        )
    """)
    op.execute("""
        CREATE POLICY teacher_sessions ON sessions
        FOR SELECT
        TO authenticated
        USING (
            student_id IN (
                SELECT student_id FROM student_teacher WHERE teacher_id = auth.uid()
            )
        )
    """)
    op.execute("""
        CREATE POLICY teacher_interaction_events ON interaction_events
        FOR SELECT
        TO authenticated
        USING (
            session_id IN (
                SELECT s.id FROM sessions s
                JOIN student_teacher st ON st.student_id = s.student_id
                WHERE st.teacher_id = auth.uid()
            )
        )
    """)
    op.execute("""
        CREATE POLICY teacher_engagement_scores ON engagement_scores
        FOR SELECT
        TO authenticated
        USING (
            session_id IN (
                SELECT s.id FROM sessions s
                JOIN student_teacher st ON st.student_id = s.student_id
                WHERE st.teacher_id = auth.uid()
            )
        )
    """)
    op.execute("""
        CREATE POLICY teacher_interventions ON interventions
        FOR SELECT
        TO authenticated
        USING (
            session_id IN (
                SELECT s.id FROM sessions s
                JOIN student_teacher st ON st.student_id = s.student_id
                WHERE st.teacher_id = auth.uid()
            )
        )
    """)


def downgrade() -> None:
    # Drop tables in reverse FK dependency order
    for table in ["interventions", "engagement_scores", "interaction_events", "sessions", "student_teacher", "tasks", "students", "profiles"]:
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")

    # Drop enum types
    for enum_type in ["intervention_outcome", "intervention_type", "event_type", "content_type", "user_role"]:
        op.execute(f"DROP TYPE IF EXISTS {enum_type}")
