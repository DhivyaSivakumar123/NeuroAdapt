"""
Unit tests for engagement_engine.py — pure function tests.

No DB, no network. All signal functions tested at:
  - 0 (minimum input)
  - 1 (maximum input)  
  - Mid-range values
  - Exactly at thresholds (0.4, 0.7) and just above/below

These tests are the primary validation mechanism for the scoring formula before
real pilot data is available to tune weights/thresholds.
"""

import pytest

from app.services.engagement_engine import (
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


# ── normalized_latency_ratio ──────────────────────────────────────────────────

class TestNormalizedLatencyRatio:
    def test_zero_actual_time(self):
        """Student completed instantly — 0 actual time → 0.0 signal."""
        result = normalized_latency_ratio(0.0, 60.0)
        assert result == pytest.approx(0.0)

    def test_exactly_expected_duration(self):
        """Actual = expected → ratio = 1.0/MAX_LATENCY_RATIO = 0.333..."""
        from app.services.engagement_engine import MAX_LATENCY_RATIO
        result = normalized_latency_ratio(60.0, 60.0)
        expected = 1.0 / MAX_LATENCY_RATIO
        assert result == pytest.approx(expected)

    def test_maximum_clamped(self):
        """Actual = MAX_LATENCY_RATIO × expected → normalized = 1.0 (max)."""
        from app.services.engagement_engine import MAX_LATENCY_RATIO
        result = normalized_latency_ratio(60.0 * MAX_LATENCY_RATIO, 60.0)
        assert result == pytest.approx(1.0)

    def test_beyond_max_is_clamped(self):
        """Actual > MAX_LATENCY_RATIO × expected → still clamps to 1.0."""
        result = normalized_latency_ratio(10000.0, 60.0)
        assert result == pytest.approx(1.0)

    def test_zero_expected_duration_safe(self):
        """expected_seconds=0 should return 0.0 (avoid divide-by-zero)."""
        result = normalized_latency_ratio(60.0, 0.0)
        assert result == pytest.approx(0.0)

    def test_half_expected_duration(self):
        """Student completed in half the expected time → low latency ratio."""
        from app.services.engagement_engine import MAX_LATENCY_RATIO
        result = normalized_latency_ratio(30.0, 60.0)
        expected = 0.5 / MAX_LATENCY_RATIO
        assert result == pytest.approx(expected)

    def test_result_always_in_0_1(self):
        """Result is always in [0, 1] for any positive inputs."""
        for actual, expected in [(0, 60), (30, 60), (60, 60), (120, 60), (9999, 60)]:
            result = normalized_latency_ratio(float(actual), float(expected))
            assert 0.0 <= result <= 1.0, f"Out of range for actual={actual}, expected={expected}"


# ── normalized_switch_rate ────────────────────────────────────────────────────

class TestNormalizedSwitchRate:
    def test_zero_switches(self):
        result = normalized_switch_rate(0, 5)
        assert result == pytest.approx(0.0)

    def test_max_switches_clamped(self):
        from app.services.engagement_engine import MAX_SWITCH_RATE
        result = normalized_switch_rate(int(MAX_SWITCH_RATE), 5)
        assert result == pytest.approx(1.0)

    def test_beyond_max_clamped(self):
        result = normalized_switch_rate(100, 5)
        assert result == pytest.approx(1.0)

    def test_half_max_switches(self):
        from app.services.engagement_engine import MAX_SWITCH_RATE
        half = int(MAX_SWITCH_RATE / 2)
        result = normalized_switch_rate(half, 5)
        assert result == pytest.approx(0.5)

    def test_result_always_in_0_1(self):
        for switches in [0, 1, 5, 10, 50]:
            result = normalized_switch_rate(switches, 3)
            assert 0.0 <= result <= 1.0


# ── abandonment_flag ──────────────────────────────────────────────────────────

class TestAbandonmentFlag:
    def test_task_abandon_returns_1(self):
        assert abandonment_flag("task_abandon") == 1.0

    def test_task_complete_returns_0(self):
        assert abandonment_flag("task_complete") == 0.0

    def test_other_event_returns_0(self):
        for event in ["task_start", "retry", "idle_ping", "self_report"]:
            assert abandonment_flag(event) == 0.0, f"Expected 0 for {event}"


# ── inverse_self_report_score ─────────────────────────────────────────────────

class TestInverseSelfReportScore:
    def test_none_returns_zero(self):
        """No self-report → neutral, don't penalize absence of data."""
        assert inverse_self_report_score(None) == pytest.approx(0.0)

    def test_score_1_returns_1(self):
        """Very bad experience (1) → maximum risk contribution (1.0)."""
        assert inverse_self_report_score(1) == pytest.approx(1.0)

    def test_score_5_returns_0(self):
        """Great experience (5) → zero risk contribution."""
        assert inverse_self_report_score(5) == pytest.approx(0.0)

    def test_score_3_midpoint(self):
        """Score 3 → (5-3)/4 = 0.5"""
        assert inverse_self_report_score(3) == pytest.approx(0.5)

    def test_score_2(self):
        """Score 2 → (5-2)/4 = 0.75"""
        assert inverse_self_report_score(2) == pytest.approx(0.75)

    def test_score_4(self):
        """Score 4 → (5-4)/4 = 0.25"""
        assert inverse_self_report_score(4) == pytest.approx(0.25)

    def test_clamped_below_1(self):
        """Scores below 1 are clamped to 1."""
        assert inverse_self_report_score(0) == pytest.approx(1.0)

    def test_clamped_above_5(self):
        """Scores above 5 are clamped to 5."""
        assert inverse_self_report_score(6) == pytest.approx(0.0)


# ── compute_engagement_risk_score ─────────────────────────────────────────────

class TestComputeEngagementRiskScore:
    def test_all_zeros(self):
        """All signals zero → score = 0.0."""
        result = compute_engagement_risk_score(0.0, 0.0, 0.0, 0.0)
        assert result == pytest.approx(0.0)

    def test_all_ones(self):
        """All signals max → score = W_LATENCY + W_SWITCH + W_ABANDON + W_SELF_REPORT = 1.0."""
        result = compute_engagement_risk_score(1.0, 1.0, 1.0, 1.0)
        assert result == pytest.approx(W_LATENCY + W_SWITCH + W_ABANDON + W_SELF_REPORT)
        assert result == pytest.approx(1.0)

    def test_weights_sum_to_1(self):
        """Weights should sum to exactly 1.0 (ensures score range is [0, 1])."""
        total = W_LATENCY + W_SWITCH + W_ABANDON + W_SELF_REPORT
        assert total == pytest.approx(1.0)

    def test_abandonment_only(self):
        """Only abandonment flag set → score = W_ABANDON × 1.0."""
        result = compute_engagement_risk_score(0.0, 0.0, 1.0, 0.0)
        assert result == pytest.approx(W_ABANDON)

    def test_known_inputs_known_output(self):
        """Regression test: fixed inputs should always produce this exact output."""
        # lat=0.5, sw=0.4, abandon=0, sr=0.75
        # = 0.3*0.5 + 0.25*0.4 + 0.25*0 + 0.2*0.75
        # = 0.15 + 0.10 + 0.0 + 0.15 = 0.40
        result = compute_engagement_risk_score(0.5, 0.4, 0.0, 0.75)
        assert result == pytest.approx(0.40, abs=1e-6)

    def test_high_disengagement_scenario(self):
        """Simulate a clearly disengaged student."""
        result = compute_engagement_risk_score(
            normalized_latency_ratio=0.9,
            normalized_switch_rate=0.8,
            abandonment_flag=1.0,
            inverse_self_report_score=0.75,
        )
        assert result > THRESHOLD_TRIGGER


# ── classify ──────────────────────────────────────────────────────────────────

class TestClassify:
    def test_zero_is_no_action(self):
        assert classify(0.0) == "no_action"

    def test_below_monitor_is_no_action(self):
        assert classify(0.399) == "no_action"

    def test_exactly_at_monitor_threshold(self):
        """Score == 0.4 → flag_monitor (>= THRESHOLD_MONITOR)."""
        assert classify(THRESHOLD_MONITOR) == "flag_monitor"

    def test_just_above_monitor(self):
        assert classify(0.401) == "flag_monitor"

    def test_mid_monitor_band(self):
        assert classify(0.55) == "flag_monitor"

    def test_exactly_at_trigger_threshold(self):
        """Score == 0.7 → flag_monitor (not > THRESHOLD_TRIGGER, only >=)."""
        assert classify(THRESHOLD_TRIGGER) == "flag_monitor"

    def test_just_above_trigger(self):
        """Score just above 0.7 → trigger_intervention."""
        assert classify(0.701) == "trigger_intervention"

    def test_maximum_is_trigger(self):
        assert classify(1.0) == "trigger_intervention"

    def test_all_three_classifications_reachable(self):
        """Ensure all three classification values are reachable."""
        assert classify(0.2) == "no_action"
        assert classify(0.55) == "flag_monitor"
        assert classify(0.85) == "trigger_intervention"
