"""
Comprehensive boundary, edge-case, and determinism tests for E1 (engagement risk)
and E2 (intervention selection).

Added for reproducible research validation of the paper:
'A Behavior-Aware Adaptive Tutoring Framework with Rule-Based Engagement-Risk
Estimation and LLM-Assisted Task Personalization'
"""

import math
import uuid
from datetime import datetime, timezone
import pytest

from app.models.interaction_event import EventType, InteractionEvent
from app.models.intervention import InterventionType
from app.services.engagement_engine import (
    MAX_LATENCY_RATIO,
    MAX_SWITCH_RATE,
    THRESHOLD_MONITOR,
    THRESHOLD_TRIGGER,
    W_ABANDON,
    W_LATENCY,
    W_SELF_REPORT,
    W_SWITCH,
    abandonment_flag,
    classify,
    compute_engagement_risk_score,
    inverse_self_report_score,
    normalized_latency_ratio,
    normalized_switch_rate,
)
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


def make_event(event_type: EventType, payload: dict, timestamp: datetime | None = None) -> InteractionEvent:
    return InteractionEvent(
        id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        task_id=uuid.uuid4(),
        event_type=event_type,
        timestamp=timestamp or datetime.now(timezone.utc),
        payload=payload,
    )


# ==============================================================================
# E1: ENGAGEMENT-RISK ESTIMATION BOUNDARY & UNIT TESTS
# ==============================================================================

class TestE1BoundariesAndSignals:
    def test_e1_min_score(self):
        """Minimum possible score across all signals is 0.0 -> no_action."""
        score = compute_engagement_risk_score(0.0, 0.0, 0.0, 0.0)
        assert score == 0.0
        assert classify(score) == "no_action"

    def test_e1_max_score(self):
        """Maximum possible score across all signals is 1.0 -> trigger_intervention."""
        score = compute_engagement_risk_score(1.0, 1.0, 1.0, 1.0)
        assert score == 1.0
        assert classify(score) == "trigger_intervention"

    def test_e1_individual_signal_latency_isolated(self):
        """Only latency at max: score = 0.30 -> no_action."""
        score = compute_engagement_risk_score(1.0, 0.0, 0.0, 0.0)
        assert math.isclose(score, W_LATENCY, abs_tol=1e-7)
        assert score == 0.30
        assert classify(score) == "no_action"

    def test_e1_individual_signal_switch_isolated(self):
        """Only switch rate at max: score = 0.25 -> no_action."""
        score = compute_engagement_risk_score(0.0, 1.0, 0.0, 0.0)
        assert math.isclose(score, W_SWITCH, abs_tol=1e-7)
        assert score == 0.25
        assert classify(score) == "no_action"

    def test_e1_individual_signal_abandonment_isolated(self):
        """Only abandonment flag set: score = 0.25 -> no_action."""
        score = compute_engagement_risk_score(0.0, 0.0, 1.0, 0.0)
        assert math.isclose(score, W_ABANDON, abs_tol=1e-7)
        assert score == 0.25
        assert classify(score) == "no_action"

    def test_e1_individual_signal_self_report_isolated(self):
        """Only self-report at lowest (1/5): score = 0.20 -> no_action."""
        score = compute_engagement_risk_score(0.0, 0.0, 0.0, 1.0)
        assert math.isclose(score, W_SELF_REPORT, abs_tol=1e-7)
        assert score == 0.20
        assert classify(score) == "no_action"

    def test_e1_max_score_without_abandonment_and_self_report(self):
        """
        Critical mathematical invariant:
        Without abandonment (0.0) and without self-report (0.0),
        maximum attainable score is 0.30*1.0 + 0.25*1.0 = 0.55.
        This proves active tasks without negative feedback or exit CANNOT trigger an intervention alone.
        """
        score = compute_engagement_risk_score(1.0, 1.0, 0.0, 0.0)
        assert math.isclose(score, 0.55, abs_tol=1e-7)
        assert classify(score) == "flag_monitor"
        assert score < THRESHOLD_TRIGGER

    def test_e1_missing_self_report_handling(self):
        """Missing self-report (None) returns 0.0 and does not penalize learner."""
        assert inverse_self_report_score(None) == 0.0

    def test_e1_missing_abandonment_handling(self):
        """All non-abandonment event types yield 0.0 for abandonment_flag."""
        for evt in ["task_start", "task_complete", "retry", "idle_ping", "self_report", "task_switch_away"]:
            assert abandonment_flag(evt) == 0.0

    def test_e1_latency_clamping_and_safeguards(self):
        """Test negative, zero expected, and extreme actual duration."""
        # Zero expected duration
        assert normalized_latency_ratio(100.0, 0.0) == 0.0
        assert normalized_latency_ratio(100.0, -10.0) == 0.0
        # Negative actual time
        assert normalized_latency_ratio(-50.0, 60.0) == 0.0
        # Extreme actual time (clamped to MAX_LATENCY_RATIO = 3.0)
        assert normalized_latency_ratio(100000.0, 60.0) == 1.0

    def test_e1_switch_rate_clamping_and_safeguards(self):
        """Test negative and excessive switch counts."""
        assert normalized_switch_rate(-5, 1) == 0.0
        assert normalized_switch_rate(0, 1) == 0.0
        assert normalized_switch_rate(10, 1) == 1.0
        assert normalized_switch_rate(100, 1) == 1.0

    def test_e1_self_report_clamping_and_safeguards(self):
        """Test out-of-range self report scores."""
        # Value below 1 clamped to 1 -> returns 1.0
        assert inverse_self_report_score(0) == 1.0
        assert inverse_self_report_score(-10) == 1.0
        # Value above 5 clamped to 5 -> returns 0.0
        assert inverse_self_report_score(6) == 0.0
        assert inverse_self_report_score(100) == 0.0

    def test_e1_threshold_boundaries_monitor(self):
        """Test exact boundaries around THRESHOLD_MONITOR = 0.40."""
        assert classify(0.399999) == "no_action"
        assert classify(0.400000) == "flag_monitor"
        assert classify(0.400001) == "flag_monitor"

    def test_e1_threshold_boundaries_trigger(self):
        """Test exact boundaries around THRESHOLD_TRIGGER = 0.70."""
        assert classify(0.699999) == "flag_monitor"
        assert classify(0.700000) == "flag_monitor"  # strict inequality: > 0.70
        assert classify(0.700001) == "trigger_intervention"

    def test_e1_determinism(self):
        """Ensure identical inputs produce identical bitwise float values over 1000 runs."""
        base_val = compute_engagement_risk_score(0.725, 0.450, 1.0, 0.500)
        for _ in range(1000):
            val = compute_engagement_risk_score(0.725, 0.450, 1.0, 0.500)
            assert val == base_val


# ==============================================================================
# E2: INTERVENTION SELECTION BOUNDARY, HIERARCHY & INTEGRATION TESTS
# ==============================================================================

class TestE2InterventionRulesAndBoundaries:
    def _signals(self, lat=0.0, sw=0.0, abandon=0.0):
        return {
            "normalized_latency_ratio": lat,
            "normalized_switch_rate": sw,
            "abandonment_flag": abandon,
        }

    # ── Rule 1: re_chunk Boundaries ───────────────────────────────────────────

    def test_e2_rechunk_exact_boundary_pass(self):
        """Exact threshold boundary: lat=0.60, sw=0.40 -> re_chunk."""
        signals = self._signals(lat=0.60, sw=0.40)
        assert select_intervention_type(signals, []) == InterventionType.re_chunk

    def test_e2_rechunk_boundary_latency_fail(self):
        """lat=0.5999, sw=0.40 -> does not trigger re_chunk."""
        signals = self._signals(lat=0.5999, sw=0.40)
        assert select_intervention_type(signals, []) != InterventionType.re_chunk

    def test_e2_rechunk_boundary_switch_fail(self):
        """lat=0.60, sw=0.3999 -> does not trigger re_chunk."""
        signals = self._signals(lat=0.60, sw=0.3999)
        assert select_intervention_type(signals, []) != InterventionType.re_chunk

    # ── Rule 2: difficulty_step_down Boundaries ───────────────────────────────

    def test_e2_step_down_exact_boundary_pass(self):
        """Exact boundary: retry_count=3, self_report=2 -> difficulty_step_down."""
        signals = self._signals(lat=0.2, sw=0.1)
        events = [make_event(EventType.retry, {"attempt_number": i}) for i in range(1, 4)]
        events.append(make_event(EventType.self_report, {"score": 2}))
        assert select_intervention_type(signals, events) == InterventionType.difficulty_step_down

    def test_e2_step_down_boundary_retry_fail(self):
        """retry_count=2, self_report=2 -> fails retry count (falls to fallback)."""
        signals = self._signals(lat=0.2, sw=0.1)
        events = [make_event(EventType.retry, {"attempt_number": i}) for i in range(1, 3)]
        events.append(make_event(EventType.self_report, {"score": 2}))
        assert select_intervention_type(signals, events) != InterventionType.difficulty_step_down

    def test_e2_step_down_boundary_report_fail(self):
        """retry_count=3, self_report=3 -> fails negative report -> falls to modality_switch."""
        signals = self._signals(lat=0.2, sw=0.1)
        events = [make_event(EventType.retry, {"attempt_number": i}) for i in range(1, 4)]
        events.append(make_event(EventType.self_report, {"score": 3}))
        assert select_intervention_type(signals, events) == InterventionType.modality_switch

    # ── Rule 3: modality_switch Boundaries ────────────────────────────────────

    def test_e2_modality_switch_with_no_self_report(self):
        """retry_count=3, no self report -> modality_switch."""
        signals = self._signals(lat=0.2, sw=0.1)
        events = [make_event(EventType.retry, {"attempt_number": i}) for i in range(1, 4)]
        assert select_intervention_type(signals, events) == InterventionType.modality_switch

    def test_e2_modality_switch_with_positive_self_report(self):
        """retry_count=3, self_report=5 -> modality_switch."""
        signals = self._signals(lat=0.2, sw=0.1)
        events = [make_event(EventType.retry, {"attempt_number": i}) for i in range(1, 4)]
        events.append(make_event(EventType.self_report, {"score": 5}))
        assert select_intervention_type(signals, events) == InterventionType.modality_switch

    # ── Rule 4: break_task Boundaries ─────────────────────────────────────────

    def test_e2_break_task_exact_idle_boundary_pass(self):
        """idle_seconds=30 -> break_task."""
        signals = self._signals()
        events = [make_event(EventType.idle_ping, {"idle_seconds": 30})]
        assert select_intervention_type(signals, events) == InterventionType.break_task

    def test_e2_break_task_abandonment_pass(self):
        """abandonment_flag=1.0 -> break_task."""
        signals = self._signals(abandon=1.0)
        assert select_intervention_type(signals, []) == InterventionType.break_task

    # ── Competing Predicate Priority Hierarchy ────────────────────────────────

    def test_e2_competing_rechunk_vs_step_down(self):
        """When conditions for re_chunk and difficulty_step_down are both met -> re_chunk wins."""
        signals = self._signals(lat=0.80, sw=0.60)
        events = [make_event(EventType.retry, {"attempt_number": i}) for i in range(1, 4)]
        events.append(make_event(EventType.self_report, {"score": 1}))
        assert select_intervention_type(signals, events) == InterventionType.re_chunk

    def test_e2_competing_rechunk_vs_break_task(self):
        """When conditions for re_chunk and break_task are both met -> re_chunk wins."""
        signals = self._signals(lat=0.80, sw=0.60, abandon=1.0)
        events = [make_event(EventType.idle_ping, {"idle_seconds": 120})]
        assert select_intervention_type(signals, events) == InterventionType.re_chunk

    def test_e2_competing_step_down_vs_break_task(self):
        """When conditions for difficulty_step_down and break_task are both met -> difficulty_step_down wins."""
        signals = self._signals(lat=0.2, sw=0.1, abandon=1.0)
        events = [make_event(EventType.retry, {"attempt_number": i}) for i in range(1, 4)]
        events.append(make_event(EventType.self_report, {"score": 1}))
        events.append(make_event(EventType.idle_ping, {"idle_seconds": 60}))
        assert select_intervention_type(signals, events) == InterventionType.difficulty_step_down

    def test_e2_competing_modality_switch_vs_break_task(self):
        """When conditions for modality_switch and break_task are both met -> modality_switch wins."""
        signals = self._signals(lat=0.2, sw=0.1, abandon=1.0)
        events = [make_event(EventType.retry, {"attempt_number": i}) for i in range(1, 4)]
        events.append(make_event(EventType.idle_ping, {"idle_seconds": 60}))
        assert select_intervention_type(signals, events) == InterventionType.modality_switch

    # ── Event Ordering and Recency ────────────────────────────────────────────

    def test_e2_self_report_recency(self):
        """Latest self-report takes precedence over older ones."""
        signals = self._signals(lat=0.2, sw=0.1)
        # Event 1: negative (score=1), Event 2: positive (score=4)
        events = [
            make_event(EventType.retry, {"attempt_number": 1}),
            make_event(EventType.retry, {"attempt_number": 2}),
            make_event(EventType.retry, {"attempt_number": 3}),
            make_event(EventType.self_report, {"score": 1}),
            make_event(EventType.self_report, {"score": 4}),
        ]
        # Because latest self report is 4 (> 2), step_down is NOT triggered; modality_switch is.
        assert select_intervention_type(signals, events) == InterventionType.modality_switch

    def test_e2_idle_recency(self):
        """Latest idle_ping takes precedence over older ones."""
        # Old ping was 45s (high idle), but latest is 10s (active again)
        events = [
            make_event(EventType.idle_ping, {"idle_seconds": 45}),
            make_event(EventType.idle_ping, {"idle_seconds": 10}),
        ]
        assert _latest_idle_seconds(events) == 10

    # ── Missing Signals and Universal Fallback ─────────────────────────────────

    def test_e2_missing_signals_fallback(self):
        """Empty signals and empty events falls back safely to break_task without exception."""
        assert select_intervention_type({}, []) == InterventionType.break_task
