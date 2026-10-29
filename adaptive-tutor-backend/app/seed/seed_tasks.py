"""
seed_tasks.py — loads hand-authored tasks from data/tasks.json into the database.

Idempotent: uses an upsert on (subject, skill_tag, difficulty_level, content_type)
to avoid duplicating rows on re-run. Updates content_body to clean encoding.

Usage:
    python -m app.seed.seed_tasks
"""

import json
import sys
from pathlib import Path

from sqlmodel import Session, create_engine, select

from app.config import get_settings
from app.models.task import Task, ContentType

DATA_FILE = Path(__file__).parent / "data" / "tasks.json"


def load_tasks(db_url: str | None = None) -> int:
    """
    Load tasks from tasks.json into the database with UTF-8 encoding.
    Returns the number of tasks inserted/updated.
    """
    settings = get_settings()
    url = db_url or settings.database_url

    if not url:
        print("ERROR: DATABASE_URL is not set. Set it in .env before seeding.", file=sys.stderr)
        sys.exit(1)

    engine = create_engine(url, echo=False)

    with DATA_FILE.open(encoding="utf-8") as f:
        raw_tasks: list[dict] = json.load(f)

    inserted = 0
    updated = 0
    with Session(engine) as session:
        for raw in raw_tasks:
            content_type = ContentType(raw["content_type"])
            question_text = raw["content_body"].get("question", "")

            stmt = select(Task).where(
                Task.subject == raw["subject"],
                Task.skill_tag == raw["skill_tag"],
                Task.difficulty_level == raw["difficulty_level"],
                Task.content_type == content_type,
            )
            existing = session.exec(stmt).all()

            if existing:
                # Update existing task with clean UTF-8 content_body
                target = existing[0]
                if target.content_body != raw["content_body"]:
                    target.content_body = raw["content_body"]
                    session.add(target)
                    updated += 1
                continue

            task = Task(
                subject=raw["subject"],
                skill_tag=raw["skill_tag"],
                difficulty_level=raw["difficulty_level"],
                expected_duration_seconds=raw["expected_duration_seconds"],
                content_type=content_type,
                content_body=raw["content_body"],
                prerequisite_task_ids=raw.get("prerequisite_task_ids", []),
                is_generated=False,
            )
            session.add(task)
            inserted += 1

        session.commit()

    print(f"Seed complete: {inserted} new tasks inserted, {updated} tasks updated with clean UTF-8 encoding.")

    try:
        from app.services.seed_biology_tasks import seed_biology_tasks
        bio_tasks = seed_biology_tasks()
        print(f"Biology knowledge & seed tasks complete: {len(bio_tasks)} grounded tasks ready.")
    except Exception as exc:
        print(f"Notice: Biology seeding skipped or completed: {exc}")

    return inserted + updated


if __name__ == "__main__":
    load_tasks()
