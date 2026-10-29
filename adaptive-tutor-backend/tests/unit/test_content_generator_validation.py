"""
Unit tests for content_generator.py — LLM output validation and retry logic.

Uses StubContentGenerator exclusively — NO real Groq API calls.
Tests:
  - Valid JSON passes validation and returns TaskVariantSchema
  - Malformed JSON triggers retry
  - Two failures → ContentGenerationError raised
  - skill_tag / subject mismatch rejected
  - content_body shape validation for each content_type
"""

import json
import pytest

from app.services.content_generator import (
    ContentGenerationError,
    StubContentGenerator,
    TaskVariantSchema,
    _parse_and_validate,
    generate_task_variant,
)


VALID_BASE_TASK = {
    "skill_tag": "cell_biology",
    "subject": "life_science",
    "difficulty_level": 2,
    "expected_duration_seconds": 90,
    "content_type": "text",
    "content_body": {
        "question": "What does the cell membrane do?",
        "answer": "controls what goes in and out",
        "hints": ["Think of it as the cell's skin"],
    },
}


# ── _parse_and_validate tests ─────────────────────────────────────────────────

class TestParseAndValidate:
    def test_valid_text_task_passes(self):
        raw = json.dumps({
            "skill_tag": "cell_biology",
            "subject": "life_science",
            "difficulty_level": 1,
            "expected_duration_seconds": 60,
            "content_type": "text",
            "content_body": {
                "question": "What is a cell?",
                "answer": "the basic unit of life",
                "hints": ["Very small", "Building block"],
            },
        })
        result = _parse_and_validate(raw, "cell_biology", "life_science")
        assert isinstance(result, TaskVariantSchema)
        assert result.skill_tag == "cell_biology"
        assert result.difficulty_level == 1

    def test_valid_interactive_task_passes(self):
        raw = json.dumps({
            "skill_tag": "cell_biology",
            "subject": "life_science",
            "difficulty_level": 1,
            "expected_duration_seconds": 60,
            "content_type": "interactive",
            "content_body": {
                "question": "Which is a cell part?",
                "options": ["Rock", "Nucleus", "Water", "Air"],
                "correct_index": 1,
            },
        })
        result = _parse_and_validate(raw, "cell_biology", "life_science")
        assert result.content_type == "interactive"

    def test_invalid_json_raises_content_generation_error(self):
        with pytest.raises(ContentGenerationError, match="invalid JSON"):
            _parse_and_validate("not json at all { oops", "cell_biology", "life_science")

    def test_wrong_skill_tag_raises_error(self):
        raw = json.dumps({
            "skill_tag": "photosynthesis",  # WRONG
            "subject": "life_science",
            "difficulty_level": 1,
            "expected_duration_seconds": 60,
            "content_type": "text",
            "content_body": {"question": "Q?", "answer": "A"},
        })
        with pytest.raises(ContentGenerationError, match="skill_tag"):
            _parse_and_validate(raw, "cell_biology", "life_science")

    def test_wrong_subject_raises_error(self):
        raw = json.dumps({
            "skill_tag": "cell_biology",
            "subject": "mathematics",  # WRONG
            "difficulty_level": 1,
            "expected_duration_seconds": 60,
            "content_type": "text",
            "content_body": {"question": "Q?", "answer": "A"},
        })
        with pytest.raises(ContentGenerationError, match="subject"):
            _parse_and_validate(raw, "cell_biology", "life_science")

    def test_interactive_missing_options_raises_error(self):
        raw = json.dumps({
            "skill_tag": "cell_biology",
            "subject": "life_science",
            "difficulty_level": 1,
            "expected_duration_seconds": 60,
            "content_type": "interactive",
            "content_body": {
                "question": "Q?",
                # Missing options and correct_index
            },
        })
        with pytest.raises(ContentGenerationError, match="content_body"):
            _parse_and_validate(raw, "cell_biology", "life_science")

    def test_interactive_correct_index_out_of_bounds_raises_error(self):
        raw = json.dumps({
            "skill_tag": "cell_biology",
            "subject": "life_science",
            "difficulty_level": 1,
            "expected_duration_seconds": 60,
            "content_type": "interactive",
            "content_body": {
                "question": "Q?",
                "options": ["A", "B"],
                "correct_index": 5,  # out of bounds
            },
        })
        with pytest.raises(ContentGenerationError):
            _parse_and_validate(raw, "cell_biology", "life_science")

    def test_missing_required_field_raises_error(self):
        raw = json.dumps({
            "skill_tag": "cell_biology",
            "subject": "life_science",
            # Missing difficulty_level, expected_duration_seconds, content_type, content_body
        })
        with pytest.raises(ContentGenerationError):
            _parse_and_validate(raw, "cell_biology", "life_science")


# ── generate_task_variant with StubContentGenerator ──────────────────────────

class TestGenerateTaskVariant:
    def test_valid_stub_returns_task_variant(self):
        """Valid stub → passes validation → returns TaskVariantSchema."""
        stub = StubContentGenerator(malformed=False)
        result, source = generate_task_variant(
            base_task_data=VALID_BASE_TASK,
            variant_type="re_chunk",
            client=stub,
        )
        assert isinstance(result, TaskVariantSchema)
        assert source == "stub"

    def test_malformed_first_response_triggers_retry(self):
        """Stub fails first call, succeeds second → returns valid result."""
        stub = StubContentGenerator(malformed=False, fail_count=1)
        result, source = generate_task_variant(
            base_task_data=VALID_BASE_TASK,
            variant_type="modality_switch",
            client=stub,
        )
        assert isinstance(result, TaskVariantSchema)
        assert stub._call_count == 2  # first failed, second succeeded

    def test_always_malformed_raises_content_generation_error(self):
        """Two consecutive failures → ContentGenerationError raised, nothing returned."""
        stub = StubContentGenerator(malformed=True)
        with pytest.raises(ContentGenerationError, match="2 attempts"):
            generate_task_variant(
                base_task_data=VALID_BASE_TASK,
                variant_type="difficulty_step_down",
                client=stub,
            )

    def test_stub_called_twice_on_first_failure(self):
        """Exactly 2 LLM calls made when first fails."""
        stub = StubContentGenerator(malformed=True)
        try:
            generate_task_variant(VALID_BASE_TASK, "break_task", client=stub)
        except ContentGenerationError:
            pass
        assert stub._call_count == 2

    def test_all_variant_types_accepted(self):
        """All 4 variant types can be passed without error."""
        for variant_type in ["re_chunk", "modality_switch", "break_task", "difficulty_step_down"]:
            stub = StubContentGenerator(malformed=False)
            result, source = generate_task_variant(VALID_BASE_TASK, variant_type, client=stub)
            assert isinstance(result, TaskVariantSchema), f"Failed for variant_type={variant_type}"
