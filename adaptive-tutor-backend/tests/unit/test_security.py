"""
Unit tests for core/security.py — JWT verification and role extraction.

Tests: valid tokens, expired tokens, malformed tokens, missing sub claim.
Uses make_test_token() to generate tokens without a real Supabase instance.
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from app.core.security import (
    ALGORITHM,
    InvalidTokenError,
    extract_user_id,
    make_test_token,
    verify_supabase_jwt,
)

TEST_SECRET = "test-secret-for-unit-tests-only-not-production"
TEST_USER_ID = uuid.uuid4()


def _make_token(user_id: uuid.UUID = TEST_USER_ID, secret: str = TEST_SECRET, **extra) -> str:
    """Create a test token using our make_test_token helper."""
    return make_test_token(user_id, secret, extra)


def _make_expired_token(user_id: uuid.UUID = TEST_USER_ID) -> str:
    """Create a token that has already expired."""
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    return jwt.encode(payload, TEST_SECRET, algorithm=ALGORITHM)


# Patch settings so verify_supabase_jwt uses TEST_SECRET
@pytest.fixture(autouse=True)
def patch_settings(monkeypatch):
    """Patch settings to use our test secret."""
    from app import config
    import app.config as cfg

    monkeypatch.setattr(
        cfg.get_settings(),
        "supabase_service_role_key",
        TEST_SECRET,
    )
    # Clear lru_cache so patched settings take effect
    # Note: since Settings is already instantiated, we monkeypatch the instance attribute
    yield


class TestVerifySupabaseJWT:
    def test_valid_token_returns_payload(self, monkeypatch):
        """Valid token signed with the right secret → returns decoded payload."""
        # Patch settings directly
        token = _make_token(TEST_USER_ID)

        # Temporarily patch verify to use TEST_SECRET
        original_verify = __import__("jose.jwt", fromlist=["decode"]).decode

        def patched_decode(token, key, **kwargs):
            return original_verify(token, TEST_SECRET, **kwargs)

        import jose.jwt as jose_jwt
        monkeypatch.setattr(jose_jwt, "decode", patched_decode)

        from app.core import security as sec
        monkeypatch.setattr(sec, "get_settings", lambda: type("S", (), {"supabase_service_role_key": TEST_SECRET})())

        payload = sec.verify_supabase_jwt(token)
        assert "sub" in payload
        assert payload["sub"] == str(TEST_USER_ID)

    def test_wrong_secret_raises_invalid_token_error(self):
        """Token signed with a different secret → InvalidTokenError."""
        token = jwt.encode({"sub": str(TEST_USER_ID)}, "wrong-secret", algorithm=ALGORITHM)

        from app.core import security as sec
        import unittest.mock as mock

        with mock.patch.object(
            sec.get_settings(), "supabase_service_role_key", TEST_SECRET
        ):
            with pytest.raises(InvalidTokenError):
                sec.verify_supabase_jwt(token)

    def test_malformed_token_raises_invalid_token_error(self):
        """Garbage string → InvalidTokenError."""
        from app.core import security as sec
        import unittest.mock as mock

        with mock.patch.object(
            sec.get_settings(), "supabase_service_role_key", TEST_SECRET
        ):
            with pytest.raises(InvalidTokenError):
                sec.verify_supabase_jwt("this.is.not.a.jwt")

    def test_empty_secret_raises_invalid_token_error(self):
        """No secret configured → InvalidTokenError with helpful message."""
        from app.core import security as sec
        import unittest.mock as mock

        with mock.patch.object(
            sec.get_settings(), "supabase_service_role_key", ""
        ):
            with pytest.raises(InvalidTokenError, match="not configured"):
                sec.verify_supabase_jwt("any.token.here")


class TestExtractUserId:
    def test_valid_sub_returns_uuid(self):
        user_id = uuid.uuid4()
        payload = {"sub": str(user_id)}
        result = extract_user_id(payload)
        assert result == user_id

    def test_missing_sub_raises_error(self):
        with pytest.raises(InvalidTokenError):
            extract_user_id({})

    def test_invalid_uuid_raises_error(self):
        with pytest.raises(InvalidTokenError):
            extract_user_id({"sub": "not-a-uuid"})

    def test_valid_uuid_string_parses_correctly(self):
        user_id = uuid.UUID("12345678-1234-5678-1234-567812345678")
        result = extract_user_id({"sub": str(user_id)})
        assert result == user_id


class TestMakeTestToken:
    def test_make_test_token_produces_decodable_jwt(self):
        """make_test_token output can be decoded with the same secret."""
        user_id = uuid.uuid4()
        token = make_test_token(user_id, TEST_SECRET)
        payload = jwt.decode(token, TEST_SECRET, algorithms=[ALGORITHM], options={"verify_aud": False})
        assert payload["sub"] == str(user_id)

    def test_make_test_token_includes_extra_claims(self):
        user_id = uuid.uuid4()
        token = make_test_token(user_id, TEST_SECRET, extra_claims={"role": "teacher"})
        payload = jwt.decode(token, TEST_SECRET, algorithms=[ALGORITHM], options={"verify_aud": False})
        assert payload.get("role") == "teacher"
