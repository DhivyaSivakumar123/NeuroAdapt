"""
Unit tests for content generator grounding check and retrieval prompt integration
(app/services/content_generator.py).
"""

import json
import uuid
import pytest

from app.models.knowledge_chunk import KnowledgeChunk
from app.services.content_generator import (
    ContentGenerationError,
    StubContentGenerator,
    TaskVariantSchema,
    check_grounding_heuristic,
    generate_task_variant,
)


class FabricatedFactGenerator:
    """Stub generator returning a fabricated fact keyword to test grounding failure."""

    def generate(self, prompt: str, system_prompt: str) -> str:
        return json.dumps({
            "skill_tag": "cell_structure",
            "subject": "biology",
            "difficulty_level": 1,
            "expected_duration_seconds": 60,
            "content_type": "text",
            "content_body": {
                "question": "What is true about Pluto? (fabricated_fact)",
                "answer": "pluto_is_a_star",
                "hints": ["invented_fake_fact"],
            },
        })


def test_check_grounding_heuristic_passes_valid_overlap():
    """Verify heuristic passes when generated text overlaps source chunk."""
    chunk = KnowledgeChunk(
        id=uuid.uuid4(),
        source_id=uuid.uuid4(),
        subject="biology",
        skill_tag="cell_structure",
        chunk_text="A cell is the basic unit of living organisms. Nucleus contains DNA.",
    )
    variant = TaskVariantSchema(
        skill_tag="cell_structure",
        subject="biology",
        difficulty_level=1,
        expected_duration_seconds=60,
        content_type="text",
        content_body={
            "question": "What is the basic unit of living organisms?",
            "answer": "cell nucleus contains DNA",
        },
    )
    is_grounded, reason = check_grounding_heuristic(variant, [chunk])
    assert is_grounded is True
    assert "passed" in reason.lower()


def test_check_grounding_heuristic_catches_fabricated_facts():
    """Verify heuristic catches fabricated facts or forbidden test keywords."""
    chunk = KnowledgeChunk(
        id=uuid.uuid4(),
        source_id=uuid.uuid4(),
        subject="biology",
        skill_tag="cell_structure",
        chunk_text="A cell is the basic unit of life.",
    )
    variant = TaskVariantSchema(
        skill_tag="cell_structure",
        subject="biology",
        difficulty_level=1,
        expected_duration_seconds=60,
        content_type="text",
        content_body={
            "question": "Which statement is true?",
            "answer": "pluto_is_a_star",
        },
    )
    is_grounded, reason = check_grounding_heuristic(variant, [chunk])
    assert is_grounded is False
    assert "fabricated fact" in reason.lower()


def test_check_grounding_heuristic_catches_plausible_non_keyword_fabrication_case_1():
    """Verify check_grounding_heuristic catches plausible non-keyword fabrication (mitochondria triple membrane)."""
    chunk = KnowledgeChunk(
        id=uuid.uuid4(),
        source_id=uuid.uuid4(),
        subject="biology",
        skill_tag="cell_structure",
        chunk_text="Organelles like mitochondria produce cellular energy (ATP) for cell functions.",
    )
    variant = TaskVariantSchema(
        skill_tag="cell_structure",
        subject="biology",
        difficulty_level=1,
        expected_duration_seconds=60,
        content_type="text",
        content_body={
            "question": "How many membranes surround mitochondria?",
            "answer": "mitochondria possess three concentric phospholipid membranes for quantum energy storage",
        },
    )
    is_grounded, reason = check_grounding_heuristic(variant, [chunk])
    assert is_grounded is False
    assert "low grounding overlap ratio" in reason.lower()


def test_check_grounding_heuristic_catches_plausible_non_keyword_fabrication_case_2():
    """Verify check_grounding_heuristic catches plausible non-keyword fabrication (chloroplast gamma fusion)."""
    chunk = KnowledgeChunk(
        id=uuid.uuid4(),
        source_id=uuid.uuid4(),
        subject="biology",
        skill_tag="cell_structure",
        chunk_text="Plant cells contain chloroplasts, which carry out photosynthesis to convert light into glucose.",
    )
    variant = TaskVariantSchema(
        skill_tag="cell_structure",
        subject="biology",
        difficulty_level=1,
        expected_duration_seconds=60,
        content_type="text",
        content_body={
            "question": "What is the primary function of chloroplasts?",
            "answer": "chloroplasts fuse atomic oxygen nuclei using electromagnetic gamma radiation",
        },
    )
    is_grounded, reason = check_grounding_heuristic(variant, [chunk])
    assert is_grounded is False
    assert "low grounding overlap ratio" in reason.lower()


def test_check_grounding_heuristic_near_miss_vocabulary_fabrication_passes_heuristic():
    """
    Demonstrates documented limitation: check_grounding_heuristic validates vocabulary overlap,
    NOT factual correctness. A near-miss fabrication that reuses source vocabulary passes the heuristic.
    """
    chunk = KnowledgeChunk(
        id=uuid.uuid4(),
        source_id=uuid.uuid4(),
        subject="biology",
        skill_tag="cell_structure",
        chunk_text="Plant cells contain chloroplasts, which carry out photosynthesis to convert light into glucose.",
    )
    # Wrong fact ("converts glucose into light"), but uses 100% source vocabulary
    near_miss_variant = TaskVariantSchema(
        skill_tag="cell_structure",
        subject="biology",
        difficulty_level=1,
        expected_duration_seconds=60,
        content_type="text",
        content_body={
            "question": "What do chloroplasts do during photosynthesis?",
            "answer": "chloroplasts convert glucose into light during photosynthesis",
        },
    )
    is_grounded, reason = check_grounding_heuristic(near_miss_variant, [chunk])
    # The heuristic passes because all words exist in the source text (overlap_ratio = 1.0)
    assert is_grounded is True
    assert "grounding check passed" in reason.lower()


def test_generate_task_variant_grounding_failure_raises_error():
    """Verify generate_task_variant raises ContentGenerationError when generator outputs ungrounded fact."""
    chunk = KnowledgeChunk(
        id=uuid.uuid4(),
        source_id=uuid.uuid4(),
        subject="biology",
        skill_tag="cell_structure",
        chunk_text="Plant cells have cell walls and chloroplasts for photosynthesis.",
    )
    base_task = {
        "subject": "biology",
        "skill_tag": "cell_structure",
        "difficulty_level": 1,
        "content_type": "text",
        "content_body": {"question": "What surrounds plant cells?", "answer": "cell wall"},
    }
    client = FabricatedFactGenerator()

    with pytest.raises(ContentGenerationError) as exc_info:
        generate_task_variant(
            base_task_data=base_task,
            variant_type="modality_switch",
            client=client,
            source_chunks=[chunk],
        )
    assert "Grounding check failed" in str(exc_info.value) or "2 attempts" in str(exc_info.value)


def test_generate_task_variant_populates_grounding_chunk_ids():
    """Verify successful generation attaches grounding chunk IDs to TaskVariantSchema."""
    chunk = KnowledgeChunk(
        id=uuid.uuid4(),
        source_id=uuid.uuid4(),
        subject="biology",
        skill_tag="cell_structure",
        chunk_text="A cell is the basic unit of living organisms. Nucleus contains DNA.",
    )
    base_task = {
        "subject": "biology",
        "skill_tag": "cell_structure",
        "difficulty_level": 1,
        "content_type": "text",
        "content_body": {"question": "What is the basic unit of life?", "answer": "cell"},
    }
    client = StubContentGenerator()

    variant, source = generate_task_variant(
        base_task_data=base_task,
        variant_type="re_chunk",
        client=client,
        source_chunks=[chunk],
    )
    assert variant.is_ai_generated is True
    assert chunk.id in variant.grounding_chunk_ids
