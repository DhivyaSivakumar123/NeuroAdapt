"""
Sentry initialization and structured logging configuration.
Call init_sentry() from app startup (app/main.py lifespan).
"""

import logging

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from app.config import get_settings

logger = logging.getLogger(__name__)


def init_sentry() -> None:
    """Initialize Sentry error monitoring if DSN is configured."""
    settings = get_settings()
    if not settings.sentry_dsn_backend:
        logger.info("Sentry DSN not configured — skipping Sentry init (OK for local dev)")
        return

    sentry_sdk.init(
        dsn=settings.sentry_dsn_backend,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.2,  # 20% of transactions traced — tune for production
        environment=settings.app_env,
        send_default_pii=False,  # Never send PII to Sentry — student data is sensitive
    )
    logger.info("Sentry initialized (env=%s)", settings.app_env)


def configure_logging() -> None:
    """Configure basic structured logging for the application."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-8s %(name)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%SZ",
    )
    # Suppress noisy SQLAlchemy echoes in non-dev environments.
    settings = get_settings()
    if settings.app_env != "development":
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
