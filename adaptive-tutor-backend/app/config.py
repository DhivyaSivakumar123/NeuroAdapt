"""
Configuration via Pydantic Settings — loads from environment variables / .env file.
All secrets (Supabase keys, Groq key, Sentry DSN) are declared here and nowhere else.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


from pathlib import Path

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE if _ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Supabase ──────────────────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""  # never sent to frontend
    supabase_jwt_secret: str = ""
    database_url: str = ""

    # ── Groq Model Config ──────────────────────────────────────────────────────
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # ── Sentry ────────────────────────────────────────────────────────────────
    sentry_dsn_backend: str = ""

    # ── App ───────────────────────────────────────────────────────────────────
    app_env: str = "development"
    enable_simulate_endpoint: bool = True  # set False in production
    cors_origins: str = "https://neurodivergent.vercel.app,http://localhost:5173,http://localhost:3000"

    # ── Test DB ───────────────────────────────────────────────────────────────
    test_database_url: str = (
        "postgresql+psycopg2://postgres:testpassword@localhost:5433/adaptive_tutor_test"
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance. Call this everywhere rather than
    constructing Settings() directly so there's a single, consistent config object."""
    return Settings()
