"""
SQLModel engine + session factory.

`get_db()` is the FastAPI dependency that provides a DB session per request.
The engine is constructed once at module import time from settings.database_url.
For tests, override the dependency to point at the test database.
"""

from collections.abc import Generator

import sqlalchemy as sa
from sqlmodel import Session, create_engine

from app.config import get_settings

settings = get_settings()

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        db_url = settings.database_url or "sqlite:///:memory:"
        try:
            kwargs = {
                "echo": (settings.app_env == "development"),
            }
            if db_url.startswith("postgresql"):
                kwargs.update({
                    "pool_pre_ping": True,
                    "pool_size": 10,
                    "max_overflow": 20,
                    "pool_recycle": 300,
                })
            _engine = create_engine(db_url, **kwargs)
        except Exception:
            _engine = create_engine("sqlite:///:memory:")
    return _engine


# Backward compatibility export
class _EngineProxy:
    def __getattr__(self, name):
        return getattr(get_engine(), name)


engine = _EngineProxy()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yield a DB session, close on exit."""
    with Session(get_engine()) as session:
        yield session

