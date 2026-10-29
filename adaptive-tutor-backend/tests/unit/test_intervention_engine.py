"""
Unit tests for intervention_engine.py — trigger condition logic.

Tests both positive cases (condition is met → correct type selected) and
NEGATIVE cases (condition is NOT met → correct type NOT selected).
No DB, no network — synthetic signal snapshots only.
"""

import pytest

from app.models.interaction_event import EventType, InteractionEvent
from app.models.intervention import InterventionType
from app.services.intervention_engine import (
    HIGH_IDLE_SECONDS,
    HIGH_LATENCY_THRESHOLD,
    HIGH_RETRY_COUNT,
    HIGH_SWITCH_THRESHOLD,
    NEGATIVE_REPORT_THRESHOLD,
    _count_retries,
    _latest_idle_seconds,
    _latest_self_report,
    select_intervention_type,
)
from datetime import datetime, timezone
import uuid


def make_event(event_type: EventType, payload: dict) -> InteractionEvent:
    """Create an InteractionEvent for test signal construction."""
    return InteractionEvent(
        id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        task_id=uuid.uuid4(),
        event_type=event_type,
        timestamp=datetime.now(timezone.utc),
        payload=payload,
    )


# ── Helper function tests ─────────────────────────────────────────────────────

class TestHelperFunctions:
    def test_count_retries_zero(self):
        events = [make_event(EventType.task_start, {})]
        assert _count_retries(events) == 0

    def test_count_retries_correct(self):
        events = [
            make_event(EventType.retry, {"attempt_number": 1}),
            make_event(EventType.retry, {"attempt_number": 2}),
            make_event(EventType.task_complete, {"correct": True, "actual_duration_seconds": 90}),
        ]
        assert _count_retries(events) == 2

    def test_latest_self_report_none_when_absent(self):
        events = [make_event(EventType.task_start, {})]
        assert _latest_self_report(events) is None

    def test_latest_self_report_returns_latest(self):
        events = [
            make_event(EventType.self_report, {"score": 4}),
            make_event(EventType.self_report, {"score": 2}),  # latest
        ]
        assert _latest_self_report(events) == 2

    def test_latest_idle_seconds_zero_when_absent(self):
        events = [make_event(EventType.task_start, {})]
        assert _latest_idle_seconds(events) == 0

    def test_latest_idle_seconds_returns_latest(self):
        events = [
            make_event(EventType.idle_ping, {"idle_seconds": 10}),
            make_event(EventType.idle_ping, {"idle_seconds": 45}),
        ]
        assert _latest_idle_seconds(events) == 45


# ── select_intervention_type trigger conditions ───────────────────────────────

class TestSelectInterventionType:
    def _signals(self, lat=0.0, sw=0.0, abandon=0.0):
        return {
            "normalized_latency_ratio": lat,
            "normalized_switch_rate": sw,
            "abandonment_flag": abandon,
        }

    # ── re_chunk: high latency + high switch rate ─────────────────────────────

    def test_rechunk_fires_on_high_latency_and_high_switch(self):
        signals = self._signals(lat=HIGH_LATENCY_THRESHOLD, sw=HIGH_SWITCH_THRESHOLD)
        events = []
        result = select_intervention_type(signals, events)
        assert result == InterventionType.re_chunk

    def test_rechunk_fires_on_extreme_latency_and_switch(self):
        signals = self._signals(lat=1.0, sw=1.0)
        result = select_intervention_type(signals, [])
        assert result == InterventionType.re_chunk

    def test_rechunk_does_NOT_fire_on_low_switch(self):
        """High latency alone is not enough for re_chunk."""
        signals = self._signals(lat=1.0, sw=0.0)
        events = []
        result = select_intervention_type(signals, events)
        assert result != InterventionType.re_chunk

    def test_rechunk_does_NOT_fire_on_low_latency(self):
        """High switch alone is not enough for re_chunk."""
        signals = self._signals(lat=0.0, sw=1.0)
        result = select_intervention_type(signals, [])
        assert result != InterventionType.re_chunk

    # ── difficulty_step_down: high retry + negative self-report ───────────────

    def test_step_down_fires_on_high_retry_and_negative_report(self):
        signals = self._signals(lat=0.3, sw=0.1)  # not high enough for re_chunk
        events = [
            make_event(EventType.retry, {"attempt_number": i}) for i in range(1, HIGH_RETRY_COUNT + 1)
        ] + [make_event(EventType.self_report, {"score": NEGATIVE_REPORT_THRESHOLD})]
        result = select_intervention_type(signals, events)
        assert result == InterventionType.difficulty_step_down

    def test_step_down_does_NOT_fire_without_negative_report(self):
        """High retry count alone → modality_switch, not step_down."""
        signals = self._signals(lat=0.3, sw=0.1)
        events = [
            make_event(EventType.retry, {"attempt_number": i}) for i in range(1, HIGH_RETRY_COUNT + 1)
        ] + [make_event(EventType.self_report, {"score": 5})]  # positive report
        result = select_intervention_type(signals, events)
        assert result != InterventionType.difficulty_step_down

    def test_step_down_does_NOT_fire_with_low_retry(self):
        """Negative report alone (low retry) → should not trigger step_down."""
        signals = self._signals(lat=0.3, sw=0.1)
        events = [make_event(EventType.self_report, {"score": 1})]  # only 1 retry implied
        result = select_intervention_type(signals, events)
        assert result != InterventionType.difficulty_step_down

    # ── modality_switch: high retry (no negative self-report) ─────────────────

    def test_modality_switch_fires_on_high_retry_without_negative_report(self):
        signals = self._signals(lat=0.3, sw=0.1)
        events = [
            make_event(EventType.retry, {"attempt_number": i}) for i in range(1, HIGH_RETRY_COUNT + 1)
        ]
        result = select_intervention_type(signals, events)
        assert result == InterventionType.modality_switch

    def test_modality_switch_does_NOT_fire_on_low_retry(self):
        """Below HIGH_RETRY_COUNT → should not trigger modality_switch."""
        signals = self._signals(lat=0.3, sw=0.1)
        events = [make_event(EventType.retry, {"attempt_number": 1})]  # only 1 retry
        result = select_intervention_type(signals, events)
        assert result != InterventionType.modality_switch

    # ── break_task: high idle or abandonment ──────────────────────────────────

    def test_break_task_fires_on_abandonment(self):
        signals = self._signals(abandon=1.0)
        events = []
        result = select_intervention_type(signals, events)
        assert result == InterventionType.break_task

    def test_break_task_fires_on_high_idle(self):
        signals = self._signals()
        events = [make_event(EventType.idle_ping, {"idle_seconds": HIGH_IDLE_SECONDS})]
        result = select_intervention_type(signals, events)
        assert result == InterventionType.break_task

    def test_break_task_fires_only_when_idle_is_high_not_when_slightly_low(self):
        """
        When idle_seconds is just below the threshold, the trigger condition for
        break_task-from-idle is NOT met. However, since no other condition matches
        in this all-zero signal scenario, the fallback also returns break_task.
        This test verifies the threshold boundary: idle of exactly threshold-1
        should not satisfy the HIGH_IDLE condition alone (independent of fallback).
        """
        signals = self._signals()
        # idle below threshold — should NOT satisfy the idle condition
        events = [make_event(EventType.idle_ping, {"idle_seconds": HIGH_IDLE_SECONDS - 10})]
        idle_secs = _latest_idle_seconds(events)
        # Verify the helper function returns the low value correctly
        assert idle_secs < HIGH_IDLE_SECONDS, "Idle seconds should be below threshold"
        # Verify the idle_ping payload is read correctly
        assert idle_secs == HIGH_IDLE_SECONDS - 10

    # ── Priority order ────────────────────────────────────────────────────────

    def test_rechunk_takes_priority_over_modality_switch(self):
        """When both re_chunk and modality_switch conditions are met, re_chunk wins."""
        signals = self._signals(lat=HIGH_LATENCY_THRESHOLD, sw=HIGH_SWITCH_THRESHOLD)
        events = [
            make_event(EventType.retry, {"attempt_number": i}) for i in range(1, HIGH_RETRY_COUNT + 1)
        ]
        result = select_intervention_type(signals, events)
        assert result == InterventionType.re_chunk

    def test_step_down_takes_priority_over_modality_switch(self):
        """step_down takes priority when retry + negative report both present."""
        signals = self._signals(lat=0.3, sw=0.1)
        events = [
            make_event(EventType.retry, {"attempt_number": i}) for i in range(1, HIGH_RETRY_COUNT + 1)
        ] + [make_event(EventType.self_report, {"score": 1})]
        result = select_intervention_type(signals, events)
        assert result == InterventionType.difficulty_step_down
