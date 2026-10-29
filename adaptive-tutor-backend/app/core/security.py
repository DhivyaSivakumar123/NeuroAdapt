"""
Supabase JWT verification and role extraction.

Supabase issues JWTs signed with the project's JWT secret (HS256).
The `role` claim in the JWT identifies the Postgres role ('authenticated', 'anon'),
but our application role (student/parent/teacher) lives in the `profiles` table.

Flow:
  1. Verify JWT signature + expiry against SUPABASE_JWT_SECRET / SUPABASE_SERVICE_ROLE_KEY
  2. Extract `sub` (= auth.users.id = profiles.id)
  3. Caller looks up the profile from DB to get our app role

Security note: NEVER log or expose the raw token. Only log the user_id after extraction.
"""

import time
import uuid
from typing import Any

from jose import JWTError, jwt
import httpx

from app.config import get_settings

ALGORITHM = "HS256"

# In-memory token verification cache: token -> (payload, expire_time)
_TOKEN_CACHE: dict[str, tuple[dict[str, Any], float]] = {}
_CACHE_TTL_SECONDS = 300  # 5 minutes


class InvalidTokenError(Exception):
    """Raised when JWT validation fails for any reason."""
    pass


def verify_supabase_jwt(token: str) -> dict[str, Any]:
    """
    Verify a Supabase JWT and return the decoded payload.

    Tries:
    1. In-memory token cache (fast path, 0 network latency)
    2. Signature verification using SUPABASE_JWT_SECRET (if configured)
    3. Signature verification using SUPABASE_SERVICE_ROLE_KEY (for local test tokens)
    4. Fallback online validation against Supabase Auth API (`GET ${SUPABASE_URL}/auth/v1/user`)

    Raises InvalidTokenError on any failure.
    """
    now = time.time()

    # 1. Fast path: check in-memory cache
    if token in _TOKEN_CACHE:
        cached_payload, expire_time = _TOKEN_CACHE[token]
        if now < expire_time:
            return cached_payload
        else:
            del _TOKEN_CACHE[token]

    settings = get_settings()
    jwt_secret = getattr(settings, "supabase_jwt_secret", "")
    service_key = getattr(settings, "supabase_service_role_key", "")

    if not jwt_secret and not service_key:
        raise InvalidTokenError(
            "SUPABASE_SERVICE_ROLE_KEY not configured — cannot verify JWT. "
            "Set it in .env (Supabase dashboard → Settings → API → service_role key)."
        )

    # 2. Try decoding with SUPABASE_JWT_SECRET
    if jwt_secret:
        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=[ALGORITHM],
                options={"verify_aud": False},
            )
            if "sub" in payload:
                _TOKEN_CACHE[token] = (payload, now + _CACHE_TTL_SECONDS)
                return payload
        except JWTError:
            pass

    # 3. Try decoding with SUPABASE_SERVICE_ROLE_KEY
    if service_key:
        try:
            payload = jwt.decode(
                token,
                service_key,
                algorithms=[ALGORITHM],
                options={"verify_aud": False},
            )
            if "sub" in payload:
                _TOKEN_CACHE[token] = (payload, now + _CACHE_TTL_SECONDS)
                return payload
        except JWTError:
            pass

    # 4. Fallback: Validate token against Supabase Auth API
    supabase_url = getattr(settings, "supabase_url", None)
    supabase_anon_key = getattr(settings, "supabase_anon_key", None)
    if supabase_url and supabase_anon_key:
        try:
            headers = {
                "apikey": supabase_anon_key,
                "Authorization": f"Bearer {token}",
            }
            res = httpx.get(
                f"{supabase_url}/auth/v1/user",
                headers=headers,
                timeout=5.0,
            )
            if res.status_code == 200:
                user_data = res.json()
                user_id = user_data.get("id")
                if user_id:
                    try:
                        unverified = jwt.get_unverified_claims(token)
                    except Exception:
                        unverified = {}
                    payload = {"sub": user_id, **unverified}
                    if "user_metadata" not in payload or not payload["user_metadata"]:
                        payload["user_metadata"] = user_data.get("user_metadata", {})
                    if "email" not in payload and "email" in user_data:
                        payload["email"] = user_data.get("email")
                    _TOKEN_CACHE[token] = (payload, now + _CACHE_TTL_SECONDS)
                    return payload
        except Exception:
            pass

    raise InvalidTokenError(
        "JWT validation failed: Token signature could not be verified and token is invalid or expired."
    )


def extract_user_id(payload: dict[str, Any]) -> uuid.UUID:
    """Extract and parse the user UUID from a verified JWT payload."""
    try:
        return uuid.UUID(payload["sub"])
    except (KeyError, ValueError) as exc:
        raise InvalidTokenError(f"Invalid 'sub' claim in JWT: {exc}") from exc


def make_test_token(user_id: uuid.UUID, secret: str, extra_claims: dict | None = None) -> str:
    """
    Generate a signed JWT for testing purposes only.
    Never call this in production code.
    """
    claims = extra_claims.copy() if extra_claims else {}
    if "exp" not in claims:
        claims["exp"] = int(time.time() + 3600)
    payload = {"sub": str(user_id), **claims}
    return jwt.encode(payload, secret, algorithm=ALGORITHM)
