"""
Engagement Engine V1 — rule-based composite scoring.

Architecture: pure functions for math (no DB/FastAPI imports) + thin DB wrapper.
This separation is intentional — the pure functions are trivially unit-testable
without any mocking of infrastructure.

WEIGHTS ARE PLACEHOLDERS — validated against pilot data in Phase 7 of the original
plan (neurodivergent-tutoring-implementation-plan.md Section 4.2). Do NOT treat
them as settled truth. They represent starting hypotheses based on engagement
literature, to be tuned Day 3 Block 2 and again after real pilot data.

The formula:
    engagement_risk_score =
        (W_LATENCY    × normalized_latency_ratio) +
        (W_SWITCH     × normalized_switch_rate) +
        (W_ABANDON    × abandonment_flag) +
        (W_SELF_REPORT × inverse_self_report_score)

Score interpretation:
    > 0.7  → trigger_intervention   (high disengagement risk)
    0.4–0.7 → flag_monitor          (elevated, monitor closely)
    < 0.4  → no_action              (engaged, continue normally)
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, select

from app.models.engagement_score import EngagementScore
from app.models.interaction_event import EventType, InteractionEvent

# ── Weight constants (named, not magic numbers inline) ────────────────────────
# Source: Section 4.2 of neurodivergent-tutoring-implementation-plan.md
# HYPOTHESIS: tune these against real pilot data.
W_LATENCY = 0.30
W_SWITCH = 0.25
W_ABANDON = 0.25
W_SELF_REPORT = 0.20

# ── Threshold constants ───────────────────────────────────────────────────────
THRESHOLD_TRIGGER = 0.70   # > this → trigger_intervention
THRESHOLD_MONITOR = 0.40   # >= this (and <= THRESHOLD_TRIGGER) → flag_monitor

# ── Signal derivation clamp bounds ───────────────────────────────────────────
# Latency ratio: clamp input to [0, MAX_LATENCY_RATIO] before normalizing.
# Ratios above 3.0× expected duration are treated as equivalent (max disengagement).
MAX_LATENCY_RATIO = 3.0
# Switch rate: clamp to [0, MAX_SWITCH_RATE] switches before treating as max.
MAX_SWITCH_RATE = 10.0


# ─────────────────────────────────────────────────────────────────────────────
# Pure signal functions — no side effects, no I/O
# ─────────────────────────────────────────────────────────────────────────────

def normalized_latency_ratio(actual_seconds: float, expected_seconds: float) -> float:
    """
    Compute the normalized latency ratio signal.

    actual_seconds / expected_seconds gives the raw ratio:
      - < 1.0 → faster than expected (possible guessing/rushing)
      - > 1.0 → slower than expected (possible disengagement/distraction)

    We normalize to [0, 1] by clamping to MAX_LATENCY_RATIO.
    Very low ratios (< 0.5) could also indicate guessing, but in V1 we only
    flag high-latency as a disengagement signal — fast completion is neutral.

    Args:
        actual_seconds: How long the student actually spent on the task.
        expected_seconds: The task's expected_duration_seconds.

    Returns float in [0, 1]. Higher = more disengagement risk.
    """
    if expected_seconds <= 0:
        return 0.0
    raw_ratio = actual_seconds / expected_seconds
    # Clamp to [0, MAX_LATENCY_RATIO], then normalize to [0, 1]
    clamped = max(0.0, min(raw_ratio, MAX_LATENCY_RATIO))
    return clamped / MAX_LATENCY_RATIO


def normalized_switch_rate(switch_count: int, session_task_count: int) -> float:
    """
    Compute the normalized switch rate signal.

    switch_count: number of task_switch_away events for this session/task.
    session_task_count: total number of tasks attempted in the session so far
    (used to normalize — a single switch on the first task is more significant
    than a single switch when 10 tasks in).

    We use switch_count directly (not per-task) since each switch is a meaningful
    attention fragmentation event. Clamp to MAX_SWITCH_RATE.

    Returns float in [0, 1]. Higher = more disengagement risk.
    """
    clamped = max(0, min(switch_count, MAX_SWITCH_RATE))
    return clamped / MAX_SWITCH_RATE


def abandonment_flag(event_type: str) -> float:
    """
    Return 1.0 if the triggering event is a task_abandon, else 0.0.
    Binary signal — abandonment is a strong disengagement indicator.
    """
    return 1.0 if event_type == EventType.task_abandon.value else 0.0


def inverse_self_report_score(self_report_value: int | None) -> float:
    """
    Invert the 1–5 self-report scale so high-risk maps to high score contribution.

    1 (very hard/bad) → 1.0 (high disengagement contribution)
    5 (easy/great)    → 0.0 (low disengagement contribution)
    None (no self-report yet) → 0.0 (neutral — don't penalize absence of data)

    Returns float in [0, 1].
    """
    if self_report_value is None:
        return 0.0
    # Clamp to valid range
    clamped = max(1, min(self_report_value, 5))
    # Invert: (5 - clamped) / 4 maps [1,5] → [1.0, 0.0]
    return (5 - clamped) / 4.0


def compute_engagement_risk_score(
    normalized_latency_ratio: float,
    normalized_switch_rate: float,
    abandonment_flag: float,  # 0.0 or 1.0
    inverse_self_report_score: float,
) -> float:
    """
    Compute the composite engagement risk score.
    All inputs should be in [0, 1].
    Output is in [0, 1] — higher = higher disengagement risk.

    Weights are placeholders (see module docstring). The formula is defined in
    Section 4.2 of neurodivergent-tutoring-implementation-plan.md.
    """
    return (
        W_LATENCY * normalized_latency_ratio
        + W_SWITCH * normalized_switch_rate
        + W_ABANDON * abandonment_flag
        + W_SELF_REPORT * inverse_self_report_score
    )


def classify(score: float) -> str:
    """
    Map a computed score to an action classification.

    Returns one of: "trigger_intervention", "flag_monitor", "no_action".
    Thresholds are named constants at module level — not magic numbers.
    """
    if score > THRESHOLD_TRIGGER:
        return "trigger_intervention"
    if score >= THRESHOLD_MONITOR:
        return "flag_monitor"
    return "no_action"


# ─────────────────────────────────────────────────────────────────────────────
# DB-aware wrapper — reads events, computes score, persists result
# ─────────────────────────────────────────────────────────────────────────────

def compute_and_persist_score(
    db: Session,
    session_id: uuid.UUID,
    task_id: uuid.UUID,
    triggering_event_type: str,
    expected_duration_seconds: int,
) -> EngagementScore:
    """
    Pull relevant signals from interaction_events for (session_id, task_id),
    compute the engagement risk score, persist an engagement_scores row,
    and return it.

    Called by the event router after inserting a scoring-relevant event.
    """
    # ── Gather raw signals from DB ────────────────────────────────────────────
    events_stmt = select(InteractionEvent).where(
        InteractionEvent.session_id == session_id,
        InteractionEvent.task_id == task_id,
    ).order_by(InteractionEvent.timestamp)
    events: list[InteractionEvent] = list(db.exec(events_stmt).all())

    # Actual duration: time from task_start to now (or to task_complete/abandon)
    task_start_events = [e for e in events if e.event_type == EventType.task_start]
    task_start_time: datetime | None = task_start_events[0].timestamp if task_start_events else None

    # For task_complete events, use the stored actual_duration_seconds from payload
    task_complete_events = [e for e in events if e.event_type == EventType.task_complete]
    if task_complete_events:
        actual_seconds = task_complete_events[-1].payload.get("actual_duration_seconds", 0)
    elif task_start_time:
        # Estimate from wall clock
        now = datetime.now(timezone.utc)
        # Handle both tz-aware and tz-naive datetimes in DB
        if task_start_time.tzinfo is None:
            task_start_time = task_start_time.replace(tzinfo=timezone.utc)
        actual_seconds = (now - task_start_time).total_seconds()
    else:
        actual_seconds = expected_duration_seconds  # fallback

    # Switch count
    switch_count = sum(
        1 for e in events if e.event_type == EventType.task_switch_away
    )

    # Session task count (how many distinct tasks in this session)
    from sqlmodel import func as sqlfunc
    session_task_count_stmt = select(sqlfunc.count(InteractionEvent.task_id.distinct())).where(
        InteractionEvent.session_id == session_id
    )
    session_task_count: int = db.exec(session_task_count_stmt).one() or 1

    # Latest self-report score for this task (if any)
    self_report_events = [e for e in events if e.event_type == EventType.self_report]
    self_report_val: int | None = (
        self_report_events[-1].payload.get("score") if self_report_events else None
    )

    # ── Compute signals ───────────────────────────────────────────────────────
    from app.services import engagement_engine as ee
    lat_ratio = ee.normalized_latency_ratio(actual_seconds, expected_duration_seconds)
    sw_rate = ee.normalized_switch_rate(switch_count, session_task_count)
    ab_flag = ee.abandonment_flag(triggering_event_type)
    sr_inv = ee.inverse_self_report_score(self_report_val)

    score = ee.compute_engagement_risk_score(lat_ratio, sw_rate, ab_flag, sr_inv)
    classification = ee.classify(score)

    signals_snapshot: dict[str, Any] = {
        "normalized_latency_ratio": round(lat_ratio, 4),
        "normalized_switch_rate": round(sw_rate, 4),
        "abandonment_flag": ab_flag,
        "inverse_self_report_score": round(sr_inv, 4),
        "actual_duration_seconds": round(actual_seconds, 1),
        "expected_duration_seconds": expected_duration_seconds,
        "switch_count": switch_count,
        "session_task_count": session_task_count,
        "self_report_value": self_report_val,
        "classification": classification,
    }

    # ── Persist ───────────────────────────────────────────────────────────────
    engagement_score = EngagementScore(
        session_id=session_id,
        task_id=task_id,
        computed_score=round(score, 6),
        computed_at=datetime.now(timezone.utc),
        signals_snapshot=signals_snapshot,
    )
    db.add(engagement_score)
    db.commit()
    db.refresh(engagement_score)

    return engagement_score
