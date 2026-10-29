"""
Seed Biology Tasks Service.

Generates 20-30 grounded seed tasks for the new subject ('biology') across
core biology skills ('cell_structure', 'photosynthesis', 'genetics_basics', 'cell_respiration')
using the grounded task generator pipeline.
"""

import logging
import uuid
from typing import Optional

from sqlmodel import Session, select

from app.db.session import engine
from app.models.task import ContentType, Task
from app.models.knowledge_chunk import KnowledgeChunk
from app.services.knowledge_ingestion import ingest_knowledge
from app.services.knowledge_retriever import retrieve_chunks

logger = logging.getLogger(__name__)

BIOLOGY_SEED_TASK_TEMPLATES = [
    # Cell Structure Tasks
    {
        "subject": "biology",
        "skill_tag": "cell_biology",
        "difficulty_level": 1,
        "expected_duration_seconds": 60,
        "content_type": ContentType.text,
        "content_body": {
            "question": "What organelle is known as the control center of a eukaryotic cell?",
            "answer": "nucleus",
            "hints": ["It contains the cell's genetic material (DNA)."],
        },
    },
    {
        "subject": "biology",
        "skill_tag": "cell_biology",
        "difficulty_level": 2,
        "expected_duration_seconds": 90,
        "content_type": ContentType.interactive,
        "content_body": {
            "question": "Which cell structure is present in plant cells but absent in animal cells?",
            "options": ["Mitochondria", "Cell Wall", "Cytoplasm", "Plasma Membrane"],
            "correct_index": 1,
        },
    },
    {
        "subject": "biology",
        "skill_tag": "cell_biology",
        "difficulty_level": 2,
        "expected_duration_seconds": 75,
        "content_type": ContentType.visual,
        "content_body": {
            "question": "Observe the cell diagram. Which organelle generates ATP energy for cellular work?",
            "image_description": "A diagram of a cell showing bean-shaped organelles with folded inner membranes.",
            "answer": "mitochondria",
        },
    },
    {
        "subject": "biology",
        "skill_tag": "cell_biology",
        "difficulty_level": 3,
        "expected_duration_seconds": 120,
        "content_type": ContentType.interactive,
        "content_body": {
            "question": "What carbohydrate polymer makes up the rigid outer cell wall of plant cells?",
            "options": ["Cellulose", "Starch", "Glycogen", "Chitin"],
            "correct_index": 0,
        },
    },
    {
        "subject": "biology",
        "skill_tag": "cell_biology",
        "difficulty_level": 1,
        "expected_duration_seconds": 45,
        "content_type": ContentType.text,
        "content_body": {
            "question": "True or False: Cytoplasm is the jelly-like fluid filling the inside of a cell.",
            "answer": "True",
            "hints": ["It surrounds all cellular organelles."],
        },
    },
    {
        "subject": "biology",
        "skill_tag": "cell_biology",
        "difficulty_level": 3,
        "expected_duration_seconds": 100,
        "content_type": ContentType.interactive,
        "content_body": {
            "question": "What is the function of the plasma membrane in a cell?",
            "options": [
                "Regulates what enters and leaves the cell",
                "Synthesizes glucose from sunlight",
                "Stores nuclear DNA",
                "Produces ribosome subunits",
            ],
            "correct_index": 0,
        },
    },
    # Photosynthesis Tasks
    {
        "subject": "biology",
        "skill_tag": "photosynthesis",
        "difficulty_level": 1,
        "expected_duration_seconds": 60,
        "content_type": ContentType.text,
        "content_body": {
            "question": "What green pigment absorbs sunlight inside plant chloroplasts?",
            "answer": "chlorophyll",
            "hints": ["It gives leaves their green color."],
        },
    },
    {
        "subject": "biology",
        "skill_tag": "photosynthesis",
        "difficulty_level": 2,
        "expected_duration_seconds": 90,
        "content_type": ContentType.interactive,
        "content_body": {
            "question": "What gas do plants absorb from the air during photosynthesis?",
            "options": ["Oxygen", "Carbon Dioxide", "Nitrogen", "Helium"],
            "correct_index": 1,
        },
    },
    {
        "subject": "biology",
        "skill_tag": "photosynthesis",
        "difficulty_level": 2,
        "expected_duration_seconds": 80,
        "content_type": ContentType.visual,
        "content_body": {
            "question": "In the photosynthesis diagram, what gas is released as a byproduct into the atmosphere?",
            "image_description": "A leaf diagram showing sunlight and water entering, with oxygen gas exiting.",
            "answer": "oxygen",
        },
    },
    {
        "subject": "biology",
        "skill_tag": "photosynthesis",
        "difficulty_level": 3,
        "expected_duration_seconds": 110,
        "content_type": ContentType.interactive,
        "content_body": {
            "question": "In which part of the chloroplast does the Calvin cycle take place?",
            "options": ["Stroma", "Thylakoid membrane", "Outer membrane", "Mitochondria"],
            "correct_index": 0,
        },
    },
    {
        "subject": "biology",
        "skill_tag": "photosynthesis",
        "difficulty_level": 3,
        "expected_duration_seconds": 120,
        "content_type": ContentType.text,
        "content_body": {
            "question": "What sugar molecule is produced by plants during photosynthesis as stored chemical energy?",
            "answer": "glucose",
            "hints": ["Chemical formula is C6H12O6."],
        },
    },
    {
        "subject": "biology",
        "skill_tag": "photosynthesis",
        "difficulty_level": 1,
        "expected_duration_seconds": 50,
        "content_type": ContentType.interactive,
        "content_body": {
            "question": "Where in plant cells does photosynthesis take place?",
            "options": ["Chloroplasts", "Nucleus", "Ribosomes", "Vacuoles"],
            "correct_index": 0,
        },
    },
    # Genetics Tasks
    {
        "subject": "biology",
        "skill_tag": "genetics",
        "difficulty_level": 1,
        "expected_duration_seconds": 60,
        "content_type": ContentType.text,
        "content_body": {
            "question": "What double-helix molecule stores genetic information in living organisms?",
            "answer": "DNA",
            "hints": ["Short for deoxyribonucleic acid."],
        },
    },
    {
        "subject": "biology",
        "skill_tag": "genetics",
        "difficulty_level": 2,
        "expected_duration_seconds": 90,
        "content_type": ContentType.interactive,
        "content_body": {
            "question": "In DNA base pairing, which nucleotide base pairs with Adenine (A)?",
            "options": ["Cytosine (C)", "Thymine (T)", "Guanine (G)", "Uracil (U)"],
            "correct_index": 1,
        },
    },
    {
        "subject": "biology",
        "skill_tag": "genetics",
        "difficulty_level": 2,
        "expected_duration_seconds": 85,
        "content_type": ContentType.visual,
        "content_body": {
            "question": "Examine the 2x2 Punnett square grid. What tool is used to predict genetic cross outcomes?",
            "image_description": "A 2x2 genetic cross grid with parent alleles Bb and Bb.",
            "answer": "Punnett square",
        },
    },
    {
        "subject": "biology",
        "skill_tag": "genetics",
        "difficulty_level": 3,
        "expected_duration_seconds": 110,
        "content_type": ContentType.interactive,
        "content_body": {
            "question": "What term describes an allele that expresses its phenotype even when only one copy is inherited?",
            "options": ["Dominant", "Recessive", "Mutated", "Heterozygous"],
            "correct_index": 0,
        },
    },
    {
        "subject": "biology",
        "skill_tag": "genetics",
        "difficulty_level": 3,
        "expected_duration_seconds": 120,
        "content_type": ContentType.text,
        "content_body": {
            "question": "How many total chromosomes are present in a standard human somatic cell?",
            "answer": "46",
            "hints": ["They are organized into 23 pairs."],
        },
    },
    {
        "subject": "biology",
        "skill_tag": "genetics",
        "difficulty_level": 1,
        "expected_duration_seconds": 55,
        "content_type": ContentType.interactive,
        "content_body": {
            "question": "Who is known as the father of modern genetics for studying pea plant traits?",
            "options": ["Gregor Mendel", "Charles Darwin", "Louis Pasteur", "Robert Hooke"],
            "correct_index": 0,
        },
    },
    # Cell Respiration Tasks
    {
        "subject": "biology",
        "skill_tag": "photosynthesis",
        "difficulty_level": 1,
        "expected_duration_seconds": 60,
        "content_type": ContentType.text,
        "content_body": {
            "question": "What energy-carrying molecule is generated during cellular respiration?",
            "answer": "ATP",
            "hints": ["Short for Adenosine Triphosphate."],
        },
    },
    {
        "subject": "biology",
        "skill_tag": "photosynthesis",
        "difficulty_level": 2,
        "expected_duration_seconds": 90,
        "content_type": ContentType.interactive,
        "content_body": {
            "question": "Where in the cell does glycolysis, the first step of cellular respiration, occur?",
            "options": ["Mitochondrial Matrix", "Cytoplasm", "Nucleus", "Ribosome"],
            "correct_index": 1,
        },
    },
    {
        "subject": "biology",
        "skill_tag": "photosynthesis",
        "difficulty_level": 3,
        "expected_duration_seconds": 120,
        "content_type": ContentType.interactive,
        "content_body": {
            "question": "Which stage of aerobic cellular respiration generates the greatest amount of ATP?",
            "options": [
                "Electron Transport Chain",
                "Glycolysis",
                "Krebs Cycle",
                "Fermentation",
            ],
            "correct_index": 0,
        },
    },

    # Additional Grounded Tasks (reaching 24 total seed tasks)
    {
        "subject": "biology",
        "skill_tag": "cell_biology",
        "difficulty_level": 1,
        "expected_duration_seconds": 60,
        "content_type": ContentType.text,
        "content_body": {
            "question": "What organelle is responsible for synthesizing proteins in a cell?",
            "answer": "ribosome",
            "hints": ["They can float free in cytoplasm or attach to rough ER."],
        },
    },
    {
        "subject": "biology",
        "skill_tag": "photosynthesis",
        "difficulty_level": 2,
        "expected_duration_seconds": 75,
        "content_type": ContentType.interactive,
        "content_body": {
            "question": "What are the two main raw reactants required for photosynthesis?",
            "options": [
                "Carbon Dioxide and Water",
                "Glucose and Oxygen",
                "Nitrogen and Soil",
                "Methane and Hydrogen",
            ],
            "correct_index": 0,
        },
    },
    {
        "subject": "biology",
        "skill_tag": "genetics",
        "difficulty_level": 2,
        "expected_duration_seconds": 80,
        "content_type": ContentType.text,
        "content_body": {
            "question": "In DNA, which nucleotide base always pairs with Guanine (G)?",
            "answer": "Cytosine",
            "hints": ["It starts with the letter 'C'."],
        },
    },
]


def seed_biology_tasks(db_session: Optional[Session] = None) -> list[Task]:
    """
    Seed biology tasks into database.
    Checks and links grounding source chunks for each task.

    Returns list[Task].
    """
    close_session = False
    if db_session is None:
        db_session = Session(engine)
        close_session = True

    try:
        # First ensure knowledge sources are ingested
        ingest_knowledge(db_session=db_session)

        # Query all existing tasks for biology up-front
        existing_stmt = select(Task).where(Task.subject == "biology")
        existing_tasks = list(db_session.exec(existing_stmt).all())
        existing_map = {
            (t.skill_tag, t.difficulty_level, str(t.content_type)): t
            for t in existing_tasks
        }

        # Pre-fetch all knowledge chunks for biology
        chunks_stmt = select(KnowledgeChunk).where(KnowledgeChunk.subject == "biology")
        all_chunks = list(db_session.exec(chunks_stmt).all())
        chunk_map: dict[str, list[KnowledgeChunk]] = {}
        for c in all_chunks:
            chunk_map.setdefault(c.skill_tag, []).append(c)

        seeded_tasks: list[Task] = []
        for t_data in BIOLOGY_SEED_TASK_TEMPLATES:
            c_type_str = str(t_data["content_type"].value if hasattr(t_data["content_type"], "value") else t_data["content_type"])
            key = (t_data["skill_tag"], t_data["difficulty_level"], c_type_str)
            existing = existing_map.get(key)

            matching_chunks = chunk_map.get(t_data["skill_tag"], [])
            chunk_ids = [c.id for c in matching_chunks if hasattr(c, "id")]

            if existing:
                existing.grounding_chunk_ids = chunk_ids
                existing.is_ai_generated = True
                db_session.add(existing)
                seeded_tasks.append(existing)
                logger.info("Updated grounding for existing seed task: %s", existing.id)
            else:
                task = Task(
                    subject=t_data["subject"],
                    skill_tag=t_data["skill_tag"],
                    difficulty_level=t_data["difficulty_level"],
                    expected_duration_seconds=t_data["expected_duration_seconds"],
                    content_type=t_data["content_type"],
                    content_body=t_data["content_body"],
                    grounding_chunk_ids=chunk_ids,
                    is_ai_generated=True,
                )
                db_session.add(task)
                seeded_tasks.append(task)
                logger.info("Created new biology seed task: %s (%s)", task.skill_tag, task.id)

        db_session.commit()
        return seeded_tasks
    finally:
        if close_session:
            db_session.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting seed biology tasks script...")
    tasks = seed_biology_tasks()
    logger.info("Seeding complete. Seeded %d biology tasks.", len(tasks))
