"""
Unit tests for student chatbot multi-turn context retention, role sanitization, and model support.
"""

import pytest
from unittest.mock import MagicMock, patch
from app.routers.students import ChatMessage, StudentChatRequest, ChatContext, student_chat
from app.models.profile import Profile, UserRole


@pytest.fixture
def mock_student_profile():
    return Profile(
        id="00000000-0000-0000-0000-000000000001",
        email="student@example.com",
        display_name="Alex Student",
        role=UserRole.student,
    )


@pytest.fixture
def mock_db_session():
    db = MagicMock()
    db.exec.return_value.first.return_value = None
    return db


@pytest.mark.asyncio
async def test_single_turn_chat(mock_db_session, mock_student_profile):
    payload = StudentChatRequest(
        messages=[ChatMessage(role="user", content="Explain Newton's second law.")],
        context=ChatContext(subject="Physics", topic="Mechanics", current_mode="focus"),
    )

    with patch("app.services.content_generator.GroqContentGenerator") as mock_gen_cls:
        mock_gen = MagicMock()
        mock_gen.chat.return_value = "Force equals mass times acceleration (F = ma)."
        mock_gen.last_source = "llm"
        mock_gen_cls.return_value = mock_gen

        response = await student_chat(payload, db=mock_db_session, current_user=mock_student_profile)

        assert response.reply == "Force equals mass times acceleration (F = ma)."
        assert response.source == "llm"
        
        # Verify system prompt grounding
        assert mock_gen.chat.called
        call_args = mock_gen.chat.call_args
        messages_sent, sys_prompt = call_args[0]
        assert len(messages_sent) == 1
        assert messages_sent[0]["role"] == "user"
        assert messages_sent[0]["content"] == "Explain Newton's second law."
        assert "Physics" in sys_prompt
        assert "Mechanics" in sys_prompt


@pytest.mark.asyncio
async def test_multiturn_chat_context_retention(mock_db_session, mock_student_profile):
    # Simulating 3 consecutive conversation turns
    payload = StudentChatRequest(
        messages=[
            ChatMessage(role="user", content="Explain Newton's second law."),
            ChatMessage(role="assistant", content="Force equals mass times acceleration (F = ma)."),
            ChatMessage(role="user", content="Can you give me a real-life example with a sports car?"),
            ChatMessage(role="assistant", content="A lightweight sports car accelerates much faster with a powerful engine than a heavy truck."),
            ChatMessage(role="user", content="What happens if the car carries extra heavy cargo?"),
        ],
        context=ChatContext(subject="Physics", topic="Mechanics", current_mode="focus"),
    )

    with patch("app.services.content_generator.GroqContentGenerator") as mock_gen_cls:
        mock_gen = MagicMock()
        mock_gen.chat.return_value = "If cargo increases mass m, acceleration a decreases for the same engine force F."
        mock_gen.last_source = "llm"
        mock_gen_cls.return_value = mock_gen

        response = await student_chat(payload, db=mock_db_session, current_user=mock_student_profile)

        assert "acceleration" in response.reply.lower() or "mass" in response.reply.lower()
        
        call_args = mock_gen.chat.call_args
        messages_sent, sys_prompt = call_args[0]
        
        # Must retain 5 messages in alternating sequence: user -> assistant -> user -> assistant -> user
        assert len(messages_sent) == 5
        assert messages_sent[0]["role"] == "user"
        assert messages_sent[1]["role"] == "assistant"
        assert messages_sent[2]["role"] == "user"
        assert messages_sent[3]["role"] == "assistant"
        assert messages_sent[4]["role"] == "user"
        assert messages_sent[4]["content"] == "What happens if the car carries extra heavy cargo?"


@pytest.mark.asyncio
async def test_role_sanitization_strips_leading_assistant(mock_db_session, mock_student_profile):
    # Payload starts with assistant message (e.g. static UI greeting)
    payload = StudentChatRequest(
        messages=[
            ChatMessage(role="assistant", content="Hello! How can I help you today?"),
            ChatMessage(role="user", content="Help me solve a quadratic equation."),
        ],
    )

    with patch("app.services.content_generator.GroqContentGenerator") as mock_gen_cls:
        mock_gen = MagicMock()
        mock_gen.chat.return_value = "Let's use the quadratic formula x = (-b ± √(b² - 4ac)) / 2a."
        mock_gen.last_source = "llm"
        mock_gen_cls.return_value = mock_gen

        response = await student_chat(payload, db=mock_db_session, current_user=mock_student_profile)

        call_args = mock_gen.chat.call_args
        messages_sent, sys_prompt = call_args[0]

        # Leading assistant greeting must be stripped so sequence begins with user
        assert messages_sent[0]["role"] == "user"
        assert messages_sent[0]["content"] == "Help me solve a quadratic equation."
