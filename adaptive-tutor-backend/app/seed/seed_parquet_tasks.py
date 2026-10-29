"""
seed_parquet_tasks.py — loads the 1,473 tasks extracted from the Parquet dataset into the database.

Idempotent: matches tasks by task_id in content_body or subject + task_id to avoid duplication.
"""

import json
import sys
import uuid
from pathlib import Path

from sqlmodel import Session, create_engine, select

from app.config import get_settings
from app.models.task import ContentType, Task

PARQUET_DATA_FILE = Path(__file__).parent / "data" / "parquet_tasks.json"

BLOOM_DIFFICULTY_MAP = {
    "remember": 1,
    "understand": 2,
    "apply": 3,
    "analyze": 4,
    "evaluate": 5,
    "create": 5,
}

def load_parquet_tasks(db_url: str | None = None) -> int:
    """
    Load tasks from parquet_tasks.json into the database.
    """
    settings = get_settings()
    url = db_url or settings.database_url

    if not url:
        print("ERROR: DATABASE_URL is not set. Set it in .env before seeding.", file=sys.stderr)
        sys.exit(1)

    if not PARQUET_DATA_FILE.exists():
        print(f"ERROR: {PARQUET_DATA_FILE} not found. Run process_parquet_dataset.py first.", file=sys.stderr)
        sys.exit(1)

    engine = create_engine(url, echo=False)

    with PARQUET_DATA_FILE.open(encoding="utf-8") as f:
        raw_tasks: list[dict] = json.load(f)

    inserted = 0
    updated = 0

    with Session(engine) as session:
        # Pre-fetch existing tasks to speed up checking
        existing_tasks = session.exec(select(Task)).all()
        existing_map = {}
        for t in existing_tasks:
            cb = t.content_body or {}
            if isinstance(cb, dict) and "task_id" in cb:
                existing_map[cb["task_id"]] = t

        for raw in raw_tasks:
            t_id = raw["task_id"]
            bloom = (raw.get("bloom_taxonomy") or "apply").lower()
            diff_level = BLOOM_DIFFICULTY_MAP.get(bloom, 3)
            
            content_body = {
                "task_id": t_id,
                "question": raw.get("prompt", ""),
                "prompt": raw.get("prompt", ""),
                "image_url": raw.get("image_url", ""),
                "initial_explanation": raw.get("uc1_initial_explanation", ""),
                "follow_up_prompt": raw.get("follow_up_prompt", ""),
                "rubrics": raw.get("rubrics", []),
                "batch": raw.get("batch", ""),
                "bloom_taxonomy": raw.get("bloom_taxonomy", "Apply")
            }

            if t_id in existing_map:
                target = existing_map[t_id]
                target.content_body = content_body
                session.add(target)
                updated += 1
            else:
                task = Task(
                    subject=raw.get("subject", "general"),
                    skill_tag=bloom,
                    difficulty_level=diff_level,
                    expected_duration_seconds=120,
                    content_type=ContentType.visual,
                    content_body=content_body,
                    prerequisite_task_ids=[],
                    is_generated=False,
                )
                session.add(task)
                inserted += 1

        session.commit()

    print(f"Parquet Task Seed complete: {inserted} new tasks inserted, {updated} tasks updated.")
    return inserted + updated

if __name__ == "__main__":
    load_parquet_tasks()
