"""
Integration tests for OpenStax knowledge ingestion service (app/services/knowledge_ingestion.py).
Tests database population, license attribution, and idempotency.
"""

import pytest
from sqlmodel import Session, select

from app.db.session import engine
from app.models.knowledge_chunk import KnowledgeChunk
from app.models.knowledge_source import KnowledgeSource
from app.services.knowledge_ingestion import OPENSTAX_BIOLOGY_SOURCE, ingest_knowledge


@pytest.mark.integration
def test_knowledge_ingestion_populates_db_and_is_idempotent():
    """Verify knowledge ingestion populates knowledge_sources and knowledge_chunks and is idempotent."""
    with Session(engine) as session:
        # Initial run
        source, chunks = ingest_knowledge(db_session=session)
        assert source.id is not None
        assert source.subject == "biology"
        assert source.license == "CC BY 4.0"
        assert len(chunks) >= 8

        source_id = source.id
        initial_chunk_count = len(chunks)

        # Confirm DB query
        stmt_sources = select(KnowledgeSource).where(KnowledgeSource.id == source_id)
        db_source = session.exec(stmt_sources).first()
        assert db_source is not None
        assert db_source.source_name == OPENSTAX_BIOLOGY_SOURCE["source_name"]

        # Re-run (idempotency check)
        source2, chunks2 = ingest_knowledge(db_session=session)
        assert source2.id == source_id
        assert len(chunks2) == initial_chunk_count

        # Total count of chunks in DB for this source should remain unchanged
        stmt_chunks = select(KnowledgeChunk).where(KnowledgeChunk.source_id == source_id)
        all_chunks = list(session.exec(stmt_chunks).all())
        assert len(all_chunks) == initial_chunk_count
