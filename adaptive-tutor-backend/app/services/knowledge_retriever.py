"""
Knowledge Retriever Service.

Pure functional module for vector similarity retrieval over `knowledge_chunks`.
Handles coverage gaps cleanly by returning empty list `[]` without erroring.
"""

import math
import logging
from typing import Optional

import sqlalchemy as sa
from sqlmodel import Session, select

from app.models.knowledge_chunk import KnowledgeChunk
from app.services.knowledge_ingestion import generate_embedding

logger = logging.getLogger(__name__)


def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Calculate cosine similarity between two numeric vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot_prod = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = math.sqrt(sum(a * a for a in vec_a))
    mag_b = math.sqrt(sum(b * b for b in vec_b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot_prod / (mag_a * mag_b)


def retrieve_chunks(
    session: Session,
    skill_tag: str,
    query_text: str = "",
    subject: Optional[str] = None,
    top_k: int = 5,
) -> list[KnowledgeChunk]:
    """
    Retrieve grounded knowledge source chunks matching the skill_tag and query.

    Uses vector similarity ranking over embeddings when available.
    Returns empty list `[]` when no chunks are found for the requested skill_tag.
    """
    if not skill_tag:
        return []

    stmt = select(KnowledgeChunk).where(KnowledgeChunk.skill_tag == skill_tag)
    if subject:
        stmt = stmt.where(KnowledgeChunk.subject == subject)

    chunks = list(session.exec(stmt).all())

    # Handle coverage gap cleanly
    if not chunks:
        logger.info("Knowledge retriever coverage gap: no chunks for skill_tag='%s'", skill_tag)
        return []

    # If query_text provided, score and sort by vector distance / cosine similarity
    if query_text:
        query_vec = generate_embedding(query_text)
        is_postgres = False
        try:
            if session.bind and session.bind.dialect.name == "postgresql":
                is_postgres = True
        except Exception:
            pass

        if is_postgres:
            # Native Postgres pgvector distance operator (<->)
            vec_str = str(query_vec)
            stmt = stmt.order_by(sa.text(f"embedding <-> '{vec_str}'")).limit(top_k)
            return list(session.exec(stmt).all())
        else:
            # SQLite / in-memory cosine similarity fallback
            scored_chunks: list[tuple[float, KnowledgeChunk]] = []
            for chunk in chunks:
                if chunk.embedding:
                    score = _cosine_similarity(query_vec, chunk.embedding)
                else:
                    score = 0.5
                scored_chunks.append((score, chunk))

            scored_chunks.sort(key=lambda x: x[0], reverse=True)
            chunks = [c for _, c in scored_chunks]

    return chunks[:top_k]
