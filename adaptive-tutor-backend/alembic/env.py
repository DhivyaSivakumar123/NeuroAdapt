"""
Alembic environment configuration.
Reads DATABASE_URL from settings (not from alembic.ini) so secrets stay in .env.
"""

import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

# Make the app package importable when running alembic from the repo root.
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# This import triggers all SQLModel table model imports via app/db/base.py.
from app.db.base import metadata  # noqa: E402
from app.config import get_settings  # noqa: E402

settings = get_settings()

# Alembic Config object
config = context.config

# Escape % for configparser if needed
if settings.database_url:
    config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generates SQL without a live connection)."""
    url = settings.database_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connects to the real DB)."""
    connectable = create_engine(
        settings.database_url,
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
