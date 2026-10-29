"""
Alembic/SQLModel model import hub.
Import every model here so Alembic's autogenerate sees all table definitions.
"""

# This import ensures all models are registered with SQLModel's metadata.
import app.models  # noqa: F401
from sqlmodel import SQLModel

# Export metadata for Alembic
metadata = SQLModel.metadata
