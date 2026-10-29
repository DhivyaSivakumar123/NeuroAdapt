"""
Task service — business logic for task CRUD, answer evaluation, catalog queries, and sequencing.
"""

import json
import logging
import uuid
from typing import Optional

import sqlalchemy as sa
from sqlmodel import Session, or_, select

from app.models.interaction_event import EventType, InteractionEvent
from app.models.session import Session as LearningSession
from app.models.task import ContentType, Task
from app.services.content_generator import GroqContentGenerator

logger = logging.getLogger(__name__)



def list_tasks(
    db: Session,
    subject: Optional[str] = None,
    skill_tag: Optional[str] = None,
    content_type: Optional[ContentType] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Task]:
    """List tasks with optional filtering. Excludes LLM-generated tasks by default."""
    stmt = select(Task).where(or_(Task.is_generated == False, Task.is_generated == None))  # noqa: E712
    if subject:
        stmt = stmt.where(Task.subject == subject)
    if skill_tag:
        stmt = stmt.where(Task.skill_tag == skill_tag)
    if content_type:
        stmt = stmt.where(Task.content_type == content_type)
    stmt = stmt.offset(offset).limit(limit)
    return list(db.exec(stmt).all())


def get_task_catalog(
    db: Session,
    subject: Optional[str] = None,
    skill_tag: Optional[str] = None,
    difficulty_level: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    """Returns tasks, distinct subjects, and distinct skill tags for curriculum browsing."""
    filter_cond = or_(Task.is_generated == False, Task.is_generated == None)  # noqa: E712

    subj_stmt = select(Task.subject).where(filter_cond).distinct()
    distinct_subjects = sorted([s for s in db.exec(subj_stmt).all() if s])

    skill_stmt = select(Task.skill_tag).where(filter_cond).distinct()
    distinct_skills = sorted([s for s in db.exec(skill_stmt).all() if s])

    stmt = select(Task).where(filter_cond)
    if subject:
        stmt = stmt.where(Task.subject == subject)
    if skill_tag:
        stmt = stmt.where(Task.skill_tag == skill_tag)
    if difficulty_level:
        stmt = stmt.where(Task.difficulty_level == difficulty_level)

    count_stmt = select(sa.func.count(Task.id)).where(filter_cond)
    if subject:
        count_stmt = count_stmt.where(Task.subject == subject)
    if skill_tag:
        count_stmt = count_stmt.where(Task.skill_tag == skill_tag)
    if difficulty_level:
        count_stmt = count_stmt.where(Task.difficulty_level == difficulty_level)

    total = db.exec(count_stmt).one() or 0
    tasks = list(db.exec(stmt.offset(offset).limit(limit)).all())

    return {
        "tasks": tasks,
        "subjects": distinct_subjects,
        "skill_tags": distinct_skills,
        "total": total,
    }


def get_task(db: Session, task_id: uuid.UUID) -> Optional[Task]:
    """Fetch a single task by ID."""
    return db.get(Task, task_id)


def evaluate_answer_llm(question: str, expected: str, student_answer: str, hints: list[str] | None = None) -> tuple[bool, str]:

    """
    Use Groq LLM to evaluate if student_answer is conceptually correct for question given expected reference answer.
    Accepts single-word key terms, synonyms, or full sentence explanations.
    """
    system_prompt = (
        "You are an expert AI tutor evaluating a student's answer to a practice question. "
        "Your task is to judge whether the student's answer is conceptually correct and shows understanding. "
        "Rules:\n"
        "1. Accept concise single-word key terms, key phrases, synonyms, or full sentence explanations.\n"
        "2. If the reference answer is a long sentence but the student provides the key correct word/term (e.g. reference 'mitochondria, because it produces energy', student 'mitochondria' or 'powerhouse'), mark it as CORRECT.\n"
        "3. Output MUST be valid JSON only with exact schema: {\"correct\": boolean, \"feedback\": \"short 1-sentence encouraging feedback\"}.\n"
        "Do NOT include markdown formatting or commentary outside JSON."
    )
    prompt = (
        f"Question: {question}\n"
        f"Reference Answer: {expected}\n"
        f"Hints: {', '.join(hints) if hints else 'None'}\n"
        f"Student Answer: {student_answer}"
    )

    try:
        generator = GroqContentGenerator()
        raw_output = generator.generate(prompt, system_prompt)
        clean_json = raw_output.strip()
        if clean_json.startswith("```"):
            clean_json = clean_json.split("```")[1]
            if clean_json.startswith("json"):
                clean_json = clean_json[4:]
            clean_json = clean_json.strip()

        data = json.loads(clean_json)
        is_corr = bool(data.get("correct", False))
        fb = str(data.get("feedback", "Great job!") if is_corr else data.get("feedback", "Not quite — review the hints and try again."))
        return is_corr, fb
    except Exception as exc:
        logger.warning("LLM evaluation error (%s) — falling back to heuristic evaluation", exc)
        return False, ""


def evaluate_answer(task: Task, answer: str) -> tuple[bool, str]:
    """
    Evaluate a student's answer against the task's expected answer.
    Returns (correct: bool, feedback: str).
    """
    body = task.content_body
    clean_student_ans = answer.lower().strip()

    if task.content_type == ContentType.interactive:
        options: list[str] = body.get("options", [])
        correct_index: int = body.get("correct_index", -1)

        if clean_student_ans.isdigit() and int(clean_student_ans) == correct_index:
            return True, "Correct!"

        correct_answer = options[correct_index].lower().strip() if options and 0 <= correct_index < len(options) else ""
        is_correct = clean_student_ans == correct_answer or (correct_answer and (correct_answer in clean_student_ans or clean_student_ans in correct_answer))
        feedback = "Correct!" if is_correct else f"Not quite. The answer was: {options[correct_index] if 0 <= correct_index < len(options) else ''}"
        return bool(is_correct), feedback

    question = body.get("question", getattr(task, "title", "") or "")
    expected: str = body.get("answer", "").lower().strip()
    hints: list[str] = body.get("hints", [])

    if expected:
        # Fast path 1: Exact match
        if clean_student_ans == expected:
            return True, "Correct!"

        # Fast path 2: Substring or containment match
        if expected in clean_student_ans or clean_student_ans in expected:
            return True, "Correct!"

        # Fast path 3: Significant word overlap / key term extraction
        stop_words = {"the", "a", "an", "is", "of", "and", "or", "in", "on", "to", "for", "by", "with", "that", "this", "it", "its", "are", "be", "was", "were", "been", "being", "have", "has", "had", "do", "does", "did", "out", "into", "from", "up", "down"}
        student_words = set(w for w in clean_student_ans.replace(",", " ").replace(".", " ").replace(";", " ").split() if len(w) > 1 and w not in stop_words)
        expected_words = set(w for w in expected.replace(",", " ").replace(".", " ").replace(";", " ").split() if len(w) > 1 and w not in stop_words)

        if expected_words:
            # Single key word expected (e.g. "cell", "cytoplasm", "mitochondria", "glucose", "atp", "herbivore")
            if len(expected_words) == 1 and list(expected_words)[0] in student_words:
                return True, "Correct!"

            if len(student_words) == 1:
                key_word = list(student_words)[0]
                if key_word in expected_words or key_word in expected:
                    return True, "Correct!"

            # Multi-word key term overlap ratio >= 40% of non-stop expected words
            matching_words = student_words.intersection(expected_words)
            if len(matching_words) / len(expected_words) >= 0.4:
                return True, "Correct!"

    # Try LLM evaluation if available
    try:
        is_llm_correct, llm_feedback = evaluate_answer_llm(question, expected, answer, hints)
        if llm_feedback:
            return is_llm_correct, llm_feedback
    except Exception as err:
        logger.warning("LLM evaluation bypassed: %s", err)

    is_correct = False
    if expected:
        is_correct = (expected in clean_student_ans or clean_student_ans in expected)
    feedback = "Correct!" if is_correct else "Not quite — review the hints and try again."
    return bool(is_correct), feedback



def get_completed_task_ids_for_session(db: Session, session_id: uuid.UUID) -> set[uuid.UUID]:
    """Return the set of task IDs that have a task_complete event in this session."""
    stmt = select(InteractionEvent.task_id).where(
        InteractionEvent.session_id == session_id,
        InteractionEvent.event_type == EventType.task_complete,
    )
    return set(db.exec(stmt).all())


def get_next_task(
    db: Session,
    student_id: uuid.UUID,
    session_id: uuid.UUID,
    subject: Optional[str] = None,
    skill_tag: Optional[str] = None,
) -> Optional[Task]:
    """
    Return the next task the student should attempt:
    - Not yet completed in any session for this student
    - All prerequisites completed in some prior session
    - Lowest difficulty_level first
    - Strictly within the given subject and skill_tag filters if provided (never mismatched)
    """
    # 1. Resolve all linked student / profile IDs for the student
    all_student_ids: set[uuid.UUID] = {student_id}
    from app.models.student import Student
    student = db.get(Student, student_id)
    if student:
        all_student_ids.add(student.id)
        if student.profile_id:
            all_student_ids.add(student.profile_id)
    else:
        students_by_profile = db.exec(
            select(Student).where(Student.profile_id == student_id)
        ).all()
        for s in students_by_profile:
            all_student_ids.add(s.id)
            if s.profile_id:
                all_student_ids.add(s.profile_id)

    # 2. Gather all session IDs associated with any of the student's identifiers
    all_sessions_stmt = select(LearningSession.id).where(
        LearningSession.student_id.in_(list(all_student_ids))
    )
    session_ids = set(db.exec(all_sessions_stmt).all())
    if session_id:
        session_ids.add(session_id)

    # 3. Collect completed & attempted task IDs across all sessions to prevent any question repetition
    completed_ids: set[uuid.UUID] = set()
    if session_ids:
        # Task complete events
        completed_stmt = select(InteractionEvent.task_id).where(
            InteractionEvent.session_id.in_(list(session_ids)),
            InteractionEvent.event_type == EventType.task_complete,
        )
        completed_ids.update(db.exec(completed_stmt).all())

        # All answer submit & start events in session to guarantee zero question redundancy in topic
        attempted_stmt = select(InteractionEvent.task_id).where(
            InteractionEvent.session_id.in_(list(session_ids)),
            InteractionEvent.event_type.in_([EventType.answer_submit, EventType.task_start]),
        )
        for t_id in db.exec(attempted_stmt).all():
            if t_id:
                completed_ids.add(t_id)

    # 4. Strict candidate query matching subject & skill_tag (excluding generated / LLM fallback)
    stmt = select(Task).where(Task.is_generated == False)  # noqa: E712
    if subject:
        clean_subj = subject.strip().lower()
        stmt = stmt.where(Task.subject == clean_subj)
    if skill_tag:
        clean_skill = skill_tag.strip().lower()
        stmt = stmt.where(Task.skill_tag == clean_skill)
    stmt = stmt.order_by(Task.difficulty_level, Task.id)

    candidates = db.exec(stmt).all()

    for task in candidates:
        if task.id in completed_ids:
            continue
        prereqs_met = all(pid in completed_ids for pid in (task.prerequisite_task_ids or []))
        if prereqs_met:
            return task

    return None
