"""
Unit tests for knowledge retriever service (app/services/knowledge_retriever.py).
Verifies vector/text retrieval, ranking, and empty fallback for coverage gaps.
"""

import uuid
import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.models.knowledge_source import KnowledgeSource
from app.models.knowledge_chunk import KnowledgeChunk
from app.services.knowledge_retriever import retrieve_chunks
from app.services.knowledge_ingestion import generate_embedding


@pytest.fixture(name="memory_session")
def fixture_memory_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    KnowledgeSource.metadata.create_all(engine, tables=[KnowledgeSource.__table__, KnowledgeChunk.__table__])
    with Session(engine) as session:
        yield session


def test_retrieve_chunks_returns_empty_when_no_coverage(memory_session: Session):
    """Confirm retrieving chunks for an unknown skill_tag returns empty list without erroring."""
    result = retrieve_chunks(session=memory_session, skill_tag="unknown_skill_xyz")
    assert result == []


def test_retrieve_chunks_returns_matching_chunks(memory_session: Session):
    """Confirm retriever returns chunks matching the requested skill_tag."""
    source = KnowledgeSource(
        subject="biology",
        source_name="OpenStax Biology Test",
        license="CC BY 4.0",
        source_url="https://openstax.org",
    )
    memory_session.add(source)
    memory_session.commit()
    memory_session.refresh(source)

    chunk1 = KnowledgeChunk(
        source_id=source.id,
        subject="biology",
        skill_tag="cell_structure",
        chunk_text="The cell nucleus stores eukaryotic DNA and controls gene expression.",
        embedding=generate_embedding("The cell nucleus stores eukaryotic DNA and controls gene expression."),
        section_title="Nucleus",
    )
    chunk2 = KnowledgeChunk(
        source_id=source.id,
        subject="biology",
        skill_tag="photosynthesis",
        chunk_text="Chloroplasts absorb light energy to produce glucose.",
        embedding=generate_embedding("Chloroplasts absorb light energy to produce glucose."),
        section_title="Photosynthesis",
    )
    memory_session.add(chunk1)
    memory_session.add(chunk2)
    memory_session.commit()

    results = retrieve_chunks(session=memory_session, skill_tag="cell_structure")
    assert len(results) == 1
    assert results[0].section_title == "Nucleus"
    assert "nucleus" in results[0].chunk_text.lower()


def test_retrieve_chunks_ranks_by_similarity(memory_session: Session):
    """Confirm query_text ranks closer semantic embeddings first."""
    source = KnowledgeSource(
        subject="biology",
        source_name="OpenStax Biology Test",
        license="CC BY 4.0",
        source_url="https://openstax.org",
    )
    memory_session.add(source)
    memory_session.commit()

    c1 = KnowledgeChunk(
        source_id=source.id,
        subject="biology",
        skill_tag="genetics_basics",
        chunk_text="DNA double helix is made of nucleotide bases A, T, C, and G.",
        embedding=generate_embedding("DNA double helix nucleotide bases A T C G"),
        section_title="DNA Structure",
    )
    c2 = KnowledgeChunk(
        source_id=source.id,
        subject="biology",
        skill_tag="genetics_basics",
        chunk_text="Punnett squares calculate allele probability in Mendelian genetics.",
        embedding=generate_embedding("Punnett square allele inheritance probability"),
        section_title="Punnett Square",
    )
    memory_session.add(c1)
    memory_session.add(c2)
    memory_session.commit()

    results = retrieve_chunks(
        session=memory_session,
        skill_tag="genetics_basics",
        query_text="DNA double helix nucleotide bases",
    )
    assert len(results) == 2
    assert results[0].section_title == "DNA Structure"
