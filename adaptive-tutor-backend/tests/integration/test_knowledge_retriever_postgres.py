"""
Integration test for Knowledge Retriever on PostgreSQL with pgvector.
Verifies native `<->` L2 distance vector sorting on PostgreSQL and prints real ranked transcript.
"""

import pytest
from sqlmodel import Session, select

from app.db.session import engine
from app.models.knowledge_chunk import KnowledgeChunk
from app.services.knowledge_ingestion import ingest_knowledge
from app.services.knowledge_retriever import retrieve_chunks


@pytest.mark.integration
def test_postgres_pgvector_retrieval_l2_distance_transcript(capsys):
    """
    Test vector retrieval against live Postgres with pgvector:
    1. Ingest OpenStax biology content into live Postgres.
    2. Query retrieve_chunks using pgvector native <-> L2 distance.
    3. Verify ranked results are returned and print transcript.
    """
    with Session(engine) as session:
        # Ingest biology content
        ingest_knowledge(db_session=session)

        # Retrieve for skill_tag='cell_structure' with query text
        query = "What is the cell wall and chloroplast in plants?"
        chunks = retrieve_chunks(
            session=session,
            subject="biology",
            skill_tag="cell_structure",
            query_text=query,
            top_k=3,
        )

        assert len(chunks) > 0
        assert any("Plant vs Animal Cells" in c.section_title for c in chunks)

        # Print transcript for verification
        print("\n--- REAL POSTGRES PGVECTOR TRANSCRIPT ---")
        print(f"Query: '{query}'")
        print(f"Retrieved {len(chunks)} chunks using pgvector <-> operator:")
        for idx, chunk in enumerate(chunks, 1):
            print(f" [{idx}] Title: {chunk.section_title} | Ref: {chunk.page_or_section_ref}")
            print(f"     Text snippet: {chunk.chunk_text[:120]}...")
        print("-----------------------------------------\n")
