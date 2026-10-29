"""
Unit tests for evaluate_answer and evaluate_answer_llm in task_service.py.
"""

from unittest.mock import patch
from app.models.task import Task, ContentType
from app.services.task_service import evaluate_answer, evaluate_answer_llm


def test_evaluate_answer_interactive_correct():
    task = Task(
        subject="math",
        skill_tag="algebra",
        difficulty_level=1,
        expected_duration_seconds=60,
        content_type=ContentType.interactive,
        content_body={
            "question": "If 3x = 21, what is x?",
            "options": ["5", "6", "7", "8"],
            "correct_index": 2
        }
    )
    correct, feedback = evaluate_answer(task, "7")
    assert correct is True
    assert "Correct" in feedback


def test_evaluate_answer_single_word_key_term_matches_long_reference_sentence():
    task = Task(
        subject="biology",
        skill_tag="cell_structure",
        difficulty_level=1,
        expected_duration_seconds=90,
        content_type=ContentType.text,
        content_body={
            "question": "What organelle is known as the powerhouse of the cell?",
            "answer": "mitochondria, because it produces most of the cell's energy through cellular respiration",
            "hints": ["It produces ATP"]
        }
    )
    # Student enters concise single-word answer
    correct, feedback = evaluate_answer(task, "mitochondria")
    assert correct is True
    assert "Correct" in feedback


def test_evaluate_answer_llm_mocked_success():
    with patch("app.services.task_service.GroqContentGenerator") as mock_gen_cls:
        mock_instance = mock_gen_cls.return_value
        mock_instance.generate.return_value = '{"correct": true, "feedback": "Great explanation!"}'

        is_corr, fb = evaluate_answer_llm(
            question="What is the function of the cell membrane?",
            expected="controls what enters and leaves the cell",
            student_answer="It acts like a border patrol deciding what moves in and out of the cell.",
            hints=["Think of cell boundary"]
        )

        assert is_corr is True
        assert fb == "Great explanation!"


def test_evaluate_answer_llm_fallback_on_exception():
    with patch("app.services.task_service.GroqContentGenerator") as mock_gen_cls:
        mock_instance = mock_gen_cls.return_value
        mock_instance.generate.side_effect = Exception("API error")

        is_corr, fb = evaluate_answer_llm(
            question="Solve x + 5 = 12",
            expected="7",
            student_answer="7",
            hints=[]
        )

        assert is_corr is False
        assert fb == ""
