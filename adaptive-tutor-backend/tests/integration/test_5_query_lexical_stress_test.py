"""
Integration test executing 5-query stress-test on Lexical / Keyword-based Knowledge Retrieval.
Meets Fixes Request #2 Item 1.2 requirements.
"""

import pytest
from sqlmodel import Session

from app.db.session import engine
from app.services.knowledge_ingestion import ingest_knowledge
from app.services.knowledge_retriever import retrieve_chunks


@pytest.mark.integration
def test_5_query_stress_test_lexical_retrieval():
    """Run 5-query stress-test for Lexical / Keyword Retrieval on PostgreSQL."""
    queries = [
        {
            "id": "Q1_synonym",
            "name": "Synonym / Paraphrase",
            "query": "the powerhouse of the cell",
            "skill_tag": "cell_structure",
        },
        {
            "id": "Q2_cross_topic",
            "name": "Cross-Topic Concept",
            "query": "How do Punnett squares predict genetic traits?",
            "skill_tag": "cell_structure",
        },
        {
            "id": "Q3_typo_informal",
            "name": "Typo / Informal Phrasing",
            "query": "plant sel wall chloroplasts and lite",
            "skill_tag": "cell_structure",
        },
        {
            "id": "Q4_no_match",
            "name": "Out of Domain / No Coverage",
            "query": "Quantum entanglement of photons in a magnetic trap",
            "skill_tag": "quantum_physics",
        },
        {
            "id": "Q5_original",
            "name": "Original Direct Query",
            "query": "What is the cell wall and chloroplast in plants?",
            "skill_tag": "cell_structure",
        },
    ]

    with Session(engine) as session:
        # Ingest content first
        ingest_knowledge(db_session=session)
        session.commit()

        print("\n=== 5-QUERY LEXICAL RETRIEVAL STRESS-TEST TRANSCRIPT ===")
        for q in queries:
            chunks = retrieve_chunks(
                session=session,
                subject="biology",
                skill_tag=q["skill_tag"],
                query_text=q["query"],
                top_k=3,
            )
            print(f"\n[{q['id']}] {q['name']}: '{q['query']}' (skill_tag='{q['skill_tag']}')")
            print(f"    Returned {len(chunks)} chunks:")
            for idx, c in enumerate(chunks, 1):
                print(f"      {idx}. {c.section_title} ({c.page_or_section_ref}) -> '{c.chunk_text[:80]}...'")
        print("=========================================================\n")
