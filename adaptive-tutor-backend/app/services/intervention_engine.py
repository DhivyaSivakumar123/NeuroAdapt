"""
Intervention Engine — trigger rules and orchestration.

This module:
  1. Evaluates signal snapshots against trigger conditions for each of the 4 intervention types
  2. Selects the appropriate intervention when engagement_risk_score > THRESHOLD_TRIGGER
  3. Calls the content generator (or fetches a pre-authored break task) to produce content
  4. Persists an Intervention row and the generated task content

TRIGGER THRESHOLD CONSTANTS — defined here (not scattered magic numbers):
These mirror the engagement engine's threshold but with finer signal-level conditions.
All documented as hypotheses to be tuned against pilot data.

Signal levels for trigger conditions:
  HIGH_LATENCY   ≥ 0.6 of normalized_latency_ratio
  HIGH_SWITCH    ≥ 0.4 of normalized_switch_rate
  HIGH_RETRY     ≥ 3 retries for the current task
  NEGATIVE_REPORT self_report score ≤ 2 (out of 5)
  HIGH_IDLE      idle_seconds ≥ 30 in the most recent idle_ping
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select

from app.models.interaction_event import EventType, InteractionEvent
from app.models.intervention import Intervention, InterventionType
from app.models.task import ContentType, Task
from app.services.content_generator import (
    ContentGenerationError,
    ContentGeneratorClient,
    TaskVariantSchema,
    generate_task_variant,
)

logger = logging.getLogger(__name__)

# ── Signal threshold constants (tune Day 3 Block 2 + post-pilot) ──────────────
# HYPOTHESIS: these starting values are informed defaults, not validated truth.
HIGH_LATENCY_THRESHOLD = 0.60   # normalized_latency_ratio
HIGH_SWITCH_THRESHOLD = 0.40    # normalized_switch_rate
HIGH_RETRY_COUNT = 3            # number of retry events for this task
NEGATIVE_REPORT_THRESHOLD = 2   # self_report score ≤ this → negative
HIGH_IDLE_SECONDS = 30          # idle_ping idle_seconds ≥ this → high idle


def _count_retries(events: list[InteractionEvent]) -> int:
    return sum(1 for e in events if e.event_type == EventType.retry)


def _latest_self_report(events: list[InteractionEvent]) -> int | None:
    sr_events = [e for e in events if e.event_type == EventType.self_report]
    if not sr_events:
        return None
    return sr_events[-1].payload.get("score")


def _latest_idle_seconds(events: list[InteractionEvent]) -> int:
    idle_events = [e for e in events if e.event_type == EventType.idle_ping]
    if not idle_events:
        return 0
    return idle_events[-1].payload.get("idle_seconds", 0)


def select_intervention_type(signals: dict[str, Any], events: list[InteractionEvent]) -> InterventionType:
    """
    Choose the intervention type based on signal snapshot and raw events.

    Priority order (when multiple conditions are met, first match wins):
      1. re_chunk:           high latency + high switch rate
      2. difficulty_step_down: high retry + negative self-report
      3. modality_switch:    high retry + moderate latency
      4. break_task:         high idle time or abandonment (fallback)

    Returns an InterventionType.
    """
    lat = signals.get("normalized_latency_ratio", 0.0)
    sw = signals.get("normalized_switch_rate", 0.0)
    abandon = signals.get("abandonment_flag", 0.0)
    retry_count = _count_retries(events)
    self_report = _latest_self_report(events)
    idle_secs = _latest_idle_seconds(events)

    high_latency = lat >= HIGH_LATENCY_THRESHOLD
    high_switch = sw >= HIGH_SWITCH_THRESHOLD
    high_retry = retry_count >= HIGH_RETRY_COUNT
    negative_report = self_report is not None and self_report <= NEGATIVE_REPORT_THRESHOLD
    high_idle = idle_secs >= HIGH_IDLE_SECONDS
    abandoned = abandon >= 1.0

    if high_latency and high_switch:
        return InterventionType.re_chunk
    if high_retry and negative_report:
        return InterventionType.difficulty_step_down
    if high_retry:
        return InterventionType.modality_switch
    if high_idle or abandoned:
        return InterventionType.break_task

    # Default fallback — should rarely be reached if score > 0.7
    logger.warning("No specific trigger condition matched for signals=%s; defaulting to break_task", signals)
    return InterventionType.break_task


def _fetch_break_task(db: Session, task: Task) -> Task | None:
    """
    Fetch a pre-authored break task: short, low-difficulty, same subject and topic.
    Break tasks must NOT use the LLM — they must be instant.
    """
    if task.skill_tag:
        stmt_topic = (
            select(Task)
            .where(
                Task.subject == task.subject,
                Task.skill_tag == task.skill_tag,
                Task.difficulty_level == 1,
                Task.id != task.id,
                Task.is_generated == False,  # noqa: E712
            )
            .limit(1)
        )
        res = db.exec(stmt_topic).first()
        if res:
            return res

    stmt = (
        select(Task)
        .where(
            Task.subject == task.subject,
            Task.difficulty_level == 1,
            Task.expected_duration_seconds <= 60,
            Task.id != task.id,
            Task.is_generated == False,  # noqa: E712
        )
        .limit(1)
    )
    return db.exec(stmt).first()


def _persist_generated_task(db: Session, variant: TaskVariantSchema, parent_task_id: uuid.UUID) -> Task:
    """Persist a generated task variant to the tasks table."""
    from app.models.task import ContentType
    new_task = Task(
        subject=variant.subject,
        skill_tag=variant.skill_tag,
        difficulty_level=variant.difficulty_level,
        expected_duration_seconds=variant.expected_duration_seconds,
        content_type=ContentType(variant.content_type),
        content_body=variant.content_body,
        prerequisite_task_ids=[],
        is_generated=True,
        is_ai_generated=getattr(variant, "is_ai_generated", True),
        grounding_chunk_ids=getattr(variant, "grounding_chunk_ids", None),
        parent_task_id=parent_task_id,
    )
    db.add(new_task)
    db.flush()  # Get the ID without committing
    return new_task


def trigger_intervention(
    db: Session,
    session_id: uuid.UUID,
    task_id: uuid.UUID,
    signals: dict[str, Any],
    content_generator_client: ContentGeneratorClient | None = None,
) -> Intervention:
    """
    Evaluate trigger conditions and create an intervention.

    Steps:
      1. Load raw events for context
      2. Select intervention type based on signals
      3. Generate or fetch content
      4. Persist Intervention row (+ generated Task row if applicable)
      5. Return the Intervention

    Does NOT commit — caller is responsible for committing the transaction.
    This allows the calling event handler to commit events + intervention atomically.
    """
    task = db.get(Task, task_id)
    if task is None:
        raise ValueError(f"Task {task_id} not found")

    # Load events for signal context
    events_stmt = select(InteractionEvent).where(
        InteractionEvent.session_id == session_id,
        InteractionEvent.task_id == task_id,
    )
    events: list[InteractionEvent] = list(db.exec(events_stmt).all())

    intervention_type = select_intervention_type(signals, events)
    generated_task_id: uuid.UUID | None = None
    generation_source: str = "stub"

    base_task_data = {
        "skill_tag": task.skill_tag,
        "subject": task.subject,
        "difficulty_level": task.difficulty_level,
        "expected_duration_seconds": task.expected_duration_seconds,
        "content_type": task.content_type.value,
        "content_body": task.content_body,
    }

    if intervention_type == InterventionType.break_task:
        # No LLM call — serve pre-authored break task
        generation_source = "stub"
        break_task = _fetch_break_task(db, task)
        if break_task:
            generated_task_id = break_task.id
            logger.info("break_task: serving pre-authored task %s", break_task.id)
        else:
            logger.warning("No suitable break task found in DB for subject=%s", task.subject)
            # Fallback to re_chunk if no break task available
            intervention_type = InterventionType.re_chunk

    if intervention_type != InterventionType.break_task:
        target_difficulty = max(1, task.difficulty_level - 1) if intervention_type == InterventionType.difficulty_step_down else None
        target_ct = ContentType.interactive.value if intervention_type == InterventionType.modality_switch else None

        try:
            variant, source = generate_task_variant(
                base_task_data=base_task_data,
                variant_type=intervention_type.value,
                client=content_generator_client,
                target_difficulty=target_difficulty,
                target_content_type=target_ct,
                session=db,
            )
            generated_task = _persist_generated_task(db, variant, task_id)
            generated_task_id = generated_task.id
            generation_source = source
            logger.info(
                "Generated task variant: type=%s, new_task_id=%s, source=%s",
                intervention_type.value,
                generated_task_id,
                generation_source,
            )
        except ContentGenerationError as exc:
            logger.error("ContentGenerationError for intervention %s: %s", intervention_type.value, exc)
            # Fallback: serve a break task rather than failing the intervention entirely
            intervention_type = InterventionType.break_task
            generation_source = "stub"
            break_task = _fetch_break_task(db, task)
            if break_task:
                generated_task_id = break_task.id

    intervention = Intervention(
        session_id=session_id,
        task_id=task_id,
        intervention_type=intervention_type,
        triggered_at=datetime.now(timezone.utc),
        outcome=None,
        generated_content_id=generated_task_id,
        generation_source=generation_source,
    )
    db.add(intervention)
    db.flush()

    logger.info(
        "Intervention created: id=%s, type=%s, session=%s, task=%s",
        intervention.id,
        intervention_type.value,
        session_id,
        task_id,
    )
    return intervention


def check_and_trigger(
    db: Session,
    session_id: uuid.UUID,
    task_id: uuid.UUID,
    engagement_score_row: Any,
    content_generator_client: ContentGeneratorClient | None = None,
) -> Intervention | None:
    """
    Entry point called after each engagement score computation.
    If the classification is 'trigger_intervention', call trigger_intervention().
    Otherwise, return None.
    """
    from app.services.engagement_engine import classify
    classification = classify(engagement_score_row.computed_score)

    if classification != "trigger_intervention":
        return None

    signals = engagement_score_row.signals_snapshot
    return trigger_intervention(
        db=db,
        session_id=session_id,
        task_id=task_id,
        signals=signals,
        content_generator_client=content_generator_client,
    )
