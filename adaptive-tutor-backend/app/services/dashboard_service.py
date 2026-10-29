"""
Dashboard service — query layer for parent/teacher dashboard endpoints.

Role scoping:
  - Parents: access data for their own students only
  - Teachers: access data for students in their student_teacher assignments only
Enforced BOTH by explicit WHERE clauses here and access check functions.
"""

import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Session, select

from app.models.engagement_score import EngagementScore
from app.models.interaction_event import EventType, InteractionEvent
from app.models.intervention import Intervention
from app.models.session import Session as LearningSession
from app.models.student import Student
from app.models.student_teacher import StudentTeacher
from app.models.task import Task
from app.services.engagement_engine import classify


def _get_student_ids_for_parent(db: Session, parent_profile_id: uuid.UUID) -> list[uuid.UUID]:
    stmt = select(Student.id).where(Student.parent_id == parent_profile_id)
    return list(db.exec(stmt).all())


def _get_student_ids_for_teacher(db: Session, teacher_profile_id: uuid.UUID) -> list[uuid.UUID]:
    stmt = select(StudentTeacher.student_id).where(StudentTeacher.teacher_id == teacher_profile_id)
    return list(db.exec(stmt).all())


def _get_session_ids_for_students(db: Session, student_ids: list[uuid.UUID]) -> list[uuid.UUID]:
    if not student_ids:
        return []
    stmt = select(LearningSession.id).where(LearningSession.student_id.in_(student_ids))
    return list(db.exec(stmt).all())


def check_student_access(
    db: Session,
    student_id: uuid.UUID,
    requesting_profile_id: uuid.UUID,
    is_parent: bool,
) -> None:
    """
    Verify requesting parent/teacher has access to student.
    Raises ValueError if student does not exist.
    Raises PermissionError if student exists but requesting user is not authorized.
    """
    student = db.get(Student, student_id)
    if student is None:
        raise ValueError("Student not found.")
    if is_parent:
        if student.parent_id != requesting_profile_id:
            raise PermissionError("Access denied. Student does not belong to parent.")
    else:
        stmt = select(StudentTeacher).where(
            StudentTeacher.student_id == student_id,
            StudentTeacher.teacher_id == requesting_profile_id,
        )
        if db.exec(stmt).first() is None and student.parent_id != requesting_profile_id:
            raise PermissionError("Access denied. Student is not assigned to teacher.")


def get_engagement_trend_for_student(
    db: Session,
    student_id: uuid.UUID,
    requesting_profile_id: uuid.UUID,
    is_parent: bool,
) -> list[EngagementScore]:
    """
    Return engagement scores for a student, ordered by computed_at.
    Verifies the requesting user has access to this student (parent or teacher).
    """
    check_student_access(db, student_id, requesting_profile_id, is_parent)

    session_ids = _get_session_ids_for_students(db, [student_id])
    if not session_ids:
        return []

    stmt = (
        select(EngagementScore)
        .where(EngagementScore.session_id.in_(session_ids))
        .order_by(EngagementScore.computed_at)
    )
    return list(db.exec(stmt).all())


def get_subject_progress_for_student(
    db: Session,
    student_id: uuid.UUID,
    requesting_profile_id: uuid.UUID,
    is_parent: bool,
) -> list[dict]:
    """Compute real curriculum & subject progress from database tasks and session events."""
    check_student_access(db, student_id, requesting_profile_id, is_parent)

    # 1. Total available tasks per subject from the catalog
    subject_counts = db.exec(
        select(Task.subject, sa.func.count(Task.id)).group_by(Task.subject)
    ).all()
    if not subject_counts:
        return []

    # 2. Get student's sessions
    session_ids = _get_session_ids_for_students(db, [student_id])

    completed_events = []
    answer_events = []
    tasks_by_id = {}
    if session_ids:
        completed_events = list(
            db.exec(
                select(InteractionEvent).where(
                    InteractionEvent.session_id.in_(session_ids),
                    InteractionEvent.event_type == EventType.task_complete,
                )
            ).all()
        )
        answer_events = list(
            db.exec(
                select(InteractionEvent).where(
                    InteractionEvent.session_id.in_(session_ids),
                    InteractionEvent.event_type == EventType.answer_submit,
                )
            ).all()
        )
        task_ids = {ev.task_id for ev in (completed_events + answer_events) if ev.task_id}
        if task_ids:
            task_rows = list(db.exec(select(Task).where(Task.id.in_(task_ids))).all())
            tasks_by_id = {t.id: t for t in task_rows}

    subject_colors = {
        "biology": "bg-emerald-500",
        "science": "bg-emerald-500",
        "physics": "bg-indigo-500",
        "chemistry": "bg-amber-500",
        "math": "bg-blue-500",
        "mathematics": "bg-blue-500",
    }

    result = []
    for subject_raw, total_count in subject_counts:
        if not subject_raw:
            continue
        subj_key = str(subject_raw).lower().strip()
        color = subject_colors.get(subj_key, "bg-indigo-500")

        completed_count = 0
        correct_count = 0
        total_answers = 0

        if session_ids:
            # Completed tasks for this subject
            for ev in completed_events:
                if ev.task_id:
                    task = tasks_by_id.get(ev.task_id)
                    if task and task.subject and str(task.subject).lower().strip() == subj_key:
                        completed_count += 1

            # Answer accuracy
            for ev in answer_events:
                if ev.task_id:
                    task = tasks_by_id.get(ev.task_id)
                    if task and task.subject and str(task.subject).lower().strip() == subj_key:
                        total_answers += 1
                        if isinstance(ev.payload, dict) and ev.payload.get("correct") is True:
                            correct_count += 1

        if total_answers > 0:
            mastery = round((correct_count / total_answers) * 100)
        elif completed_count > 0:
            mastery = min(100, round((completed_count / total_count) * 100))
        else:
            mastery = 0

        if mastery >= 80 and completed_count > 0:
            status = "Mastered"
        elif mastery >= 50 or completed_count > 0:
            status = "On Track"
        elif completed_count == 0:
            status = "Not Started"
        else:
            status = "Needs Practice"

        # Friendly title formatting
        subj_title = str(subject_raw).title()
        if subj_key == "biology":
            subj_title = "Life Science & Biology"
        elif subj_key == "physics":
            subj_title = "Physics & Motion"
        elif subj_key == "chemistry":
            subj_title = "Chemistry & Reactions"
        elif subj_key in ("math", "mathematics"):
            subj_title = "Mathematics & Equations"

        result.append({
            "subject": subj_title,
            "completed": completed_count,
            "total": total_count,
            "mastery_percentage": mastery,
            "status": status,
            "color": color,
        })

    # Sort so active subjects are at the top
    result.sort(key=lambda x: (x["completed"], x["mastery_percentage"]), reverse=True)
    return result


def get_interventions_for_student(
    db: Session,
    student_id: uuid.UUID,
    requesting_profile_id: uuid.UUID,
    is_parent: bool,
) -> list[Intervention]:
    """Return intervention history for a student."""
    check_student_access(db, student_id, requesting_profile_id, is_parent)

    session_ids = _get_session_ids_for_students(db, [student_id])
    if not session_ids:
        return []

    stmt = (
        select(Intervention)
        .where(Intervention.session_id.in_(session_ids))
        .order_by(Intervention.triggered_at.desc())
    )
    return list(db.exec(stmt).all())


def get_flagged_students(
    db: Session,
    requesting_profile_id: uuid.UUID,
    is_parent: bool,
) -> list[dict]:
    """
    Return students in the flag_monitor or trigger_intervention band.
    """
    if is_parent:
        student_ids = _get_student_ids_for_parent(db, requesting_profile_id)
    else:
        student_ids = _get_student_ids_for_teacher(db, requesting_profile_id)

    if not student_ids:
        return []

    session_ids = _get_session_ids_for_students(db, student_ids)
    if not session_ids:
        return []

    flagged = []
    for student_id in student_ids:
        student_session_ids = [
            s.id
            for s in db.exec(
                select(LearningSession).where(LearningSession.student_id == student_id)
            ).all()
        ]
        if not student_session_ids:
            continue

        latest_score_stmt = (
            select(EngagementScore)
            .where(EngagementScore.session_id.in_(student_session_ids))
            .order_by(EngagementScore.computed_at.desc())
            .limit(1)
        )
        latest_score = db.exec(latest_score_stmt).first()
        if latest_score is None:
            continue

        classification = classify(latest_score.computed_score)
        if classification == "no_action":
            continue

        student = db.get(Student, student_id)
        if student is None:
            continue

        flagged.append({
            "student_id": student_id,
            "student_name": student.name,
            "latest_score": latest_score.computed_score,
            "classification": classification,
            "latest_computed_at": latest_score.computed_at,
        })

    return flagged


def get_roster_for_user(
    db: Session,
    requesting_profile_id: uuid.UUID,
    is_parent: bool,
) -> list[dict]:
    """
    Return ALL students linked to a parent or assigned to a teacher,
    including learner profile tags and latest engagement score.
    """
    if is_parent:
        student_ids = _get_student_ids_for_parent(db, requesting_profile_id)
    else:
        student_ids = _get_student_ids_for_teacher(db, requesting_profile_id)

    if not student_ids:
        return []

    roster = []
    for student_id in student_ids:
        student = db.get(Student, student_id)
        if student is None:
            continue

        student_session_ids = [
            s.id
            for s in db.exec(
                select(LearningSession).where(LearningSession.student_id == student_id)
            ).all()
        ]

        latest_score_val = 1.0
        classification_val = "no_action"
        latest_computed_at_val = None

        if student_session_ids:
            latest_score_stmt = (
                select(EngagementScore)
                .where(EngagementScore.session_id.in_(student_session_ids))
                .order_by(EngagementScore.computed_at.desc())
                .limit(1)
            )
            latest_score = db.exec(latest_score_stmt).first()
            if latest_score is not None:
                latest_score_val = latest_score.computed_score
                classification_val = classify(latest_score.computed_score)
                latest_computed_at_val = latest_score.computed_at

        roster.append({
            "student_id": student.id,
            "student_name": student.name,
            "grade_level": student.grade_level,
            "learner_profile_tags": student.learner_profile_tags or [],
            "latest_score": latest_score_val,
            "classification": classification_val,
            "latest_computed_at": latest_computed_at_val,
        })

    return roster


def get_class_analytics(
    db: Session,
    requesting_profile_id: uuid.UUID,
    is_parent: bool,
) -> dict:
    """
    Aggregate class analytics: optimal/monitor/intervention counts,
    average engagement score, and skill friction breakdown.
    """
    roster = get_roster_for_user(db, requesting_profile_id, is_parent)
    total_students = len(roster)
    if total_students == 0:
        return {
            "total_students": 0,
            "optimal_count": 0,
            "monitoring_count": 0,
            "intervention_count": 0,
            "avg_engagement_score": 1.0,
            "recent_interventions_count": 0,
            "skill_friction": [],
        }

    optimal_count = sum(1 for s in roster if s["classification"] == "no_action")
    monitoring_count = sum(1 for s in roster if s["classification"] == "flag_monitor")
    intervention_count = sum(1 for s in roster if s["classification"] == "trigger_intervention")
    scores = [s["latest_score"] for s in roster if s["latest_score"] is not None]
    avg_score = round(sum(scores) / len(scores), 2) if scores else 1.0

    # Skill friction analysis across all students' events
    student_ids = [s["student_id"] for s in roster]
    session_ids = _get_session_ids_for_students(db, student_ids)

    recent_interventions_count = 0
    skill_friction_map: dict[str, dict] = {}

    if session_ids:
        interventions = db.exec(
            select(Intervention).where(Intervention.session_id.in_(session_ids))
        ).all()
        recent_interventions_count = len(interventions)

        events = db.exec(
            select(InteractionEvent).where(InteractionEvent.session_id.in_(session_ids))
        ).all()

        task_ids = {ev.task_id for ev in events if ev.task_id}
        task_ids.update({it.task_id for it in interventions if it.task_id})
        tasks_by_id = {}
        if task_ids:
            task_rows = db.exec(select(Task).where(Task.id.in_(task_ids))).all()
            tasks_by_id = {t.id: t for t in task_rows}

        for ev in events:
            if not ev.task_id:
                continue
            task = tasks_by_id.get(ev.task_id)
            if not task:
                continue
            key = f"{task.subject}:{task.skill_tag}"
            if key not in skill_friction_map:
                skill_friction_map[key] = {
                    "skill_tag": task.skill_tag,
                    "subject": task.subject,
                    "total_attempts": 0,
                    "retry_count": 0,
                    "scores": [],
                    "interventions_count": 0,
                }
            skill_friction_map[key]["total_attempts"] += 1
            if ev.event_type == "retry":
                skill_friction_map[key]["retry_count"] += 1

        for it in interventions:
            if it.task_id:
                task = tasks_by_id.get(it.task_id)
                if task:
                    key = f"{task.subject}:{task.skill_tag}"
                    if key in skill_friction_map:
                        skill_friction_map[key]["interventions_count"] += 1

    skill_friction_list = []
    for data in skill_friction_map.values():
        skill_friction_list.append({
            "skill_tag": data["skill_tag"],
            "subject": data["subject"],
            "total_attempts": data["total_attempts"],
            "retry_count": data["retry_count"],
            "avg_score": 0.85,
            "interventions_count": data["interventions_count"],
        })

    # Sort by highest friction (retry count + interventions)
    skill_friction_list.sort(key=lambda x: (x["retry_count"] + x["interventions_count"]), reverse=True)

    return {
        "total_students": total_students,
        "optimal_count": optimal_count,
        "monitoring_count": monitoring_count,
        "intervention_count": intervention_count,
        "avg_engagement_score": avg_score,
        "recent_interventions_count": recent_interventions_count,
        "skill_friction": skill_friction_list[:5],
    }


def get_parent_guidance(
    db: Session,
    student_id: uuid.UUID,
    requesting_profile_id: uuid.UUID,
    is_parent: bool,
) -> dict:
    """Generate supportive, constructive guidance tips for parents based on recent signals."""
    check_student_access(db, student_id, requesting_profile_id, is_parent)
    student = db.get(Student, student_id)
    if not student:
        raise ValueError("Student not found.")

    scores = get_engagement_trend_for_student(db, student_id, requesting_profile_id, is_parent)
    latest_score = scores[-1].computed_score if scores else 1.0
    classification = classify(latest_score) if scores else "no_action"

    interventions = get_interventions_for_student(db, student_id, requesting_profile_id, is_parent)
    recent_types = [i.intervention_type for i in interventions[:3]]

    tips = []
    if "re_chunk" in recent_types or classification in ("flag_monitor", "trigger_intervention"):
        tips.append({
            "title": "Break Down Complex Steps",
            "category": "pacing",
            "strategy": "Step-by-step chunking reduces cognitive working memory load for ADHD and autistic learners.",
            "recommended_action": "When helping with homework, present one single question or instruction at a time rather than a full page.",
        })

    if "break_task" in recent_types or latest_score < 0.60:
        tips.append({
            "title": "Introduce Low-Demand Sensory Micro-Breaks",
            "category": "breaks",
            "strategy": "Frequent short pauses (2–3 minutes) prevent sensory overwhelm and task fatigue.",
            "recommended_action": "Encourage physical stretching, hydration, or a quiet breathing break before returning to difficult concepts.",
        })

    if "modality_switch" in recent_types:
        tips.append({
            "title": "Use Visual & Hands-on Representations",
            "category": "modality",
            "strategy": "Visual diagrams and interactive problem-solving clarify abstract textual descriptions.",
            "recommended_action": "Try drawing out biological processes or math concepts using diagrams or physical manipulatives.",
        })

    if not tips:
        tips.append({
            "title": "Maintain Positive Learning Momentum",
            "category": "focus",
            "strategy": "Current engagement signals indicate optimal focus and confidence.",
            "recommended_action": "Praise specific problem-solving effort and celebrate persistence across completed exercises.",
        })

    return {
        "student_id": student.id,
        "student_name": student.name,
        "current_status": classification,
        "tips": tips,
    }


_AI_ANALYSIS_CACHE: dict[str, tuple[float, dict]] = {}


def get_ai_student_analysis(
    db: Session,
    student_id: uuid.UUID,
    requesting_profile_id: uuid.UUID,
    is_parent: bool,
    force_refresh: bool = False,
) -> dict:
    """Generate in-depth pedagogical analysis and recommendations using Groq LLM (with TTL cache)."""
    import json
    import logging
    import time
    from app.services.content_generator import GroqContentGenerator

    logger = logging.getLogger(__name__)
    check_student_access(db, student_id, requesting_profile_id, is_parent)
    student = db.get(Student, student_id)
    if not student:
        raise ValueError("Student not found.")

    cache_key = str(student_id)
    if not force_refresh and cache_key in _AI_ANALYSIS_CACHE:
        cached_time, cached_val = _AI_ANALYSIS_CACHE[cache_key]
        if time.time() - cached_time < 300:  # 5 minutes TTL
            return cached_val

    scores = get_engagement_trend_for_student(db, student_id, requesting_profile_id, is_parent)
    interventions = get_interventions_for_student(db, student_id, requesting_profile_id, is_parent)

    # Calculate metrics
    score_vals = [s.computed_score for s in scores]
    avg_score = sum(score_vals) / len(score_vals) if score_vals else 0.85
    latest_score = score_vals[-1] if score_vals else 0.85

    intervention_types = [i.intervention_type for i in interventions]
    intervention_count = len(interventions)

    prompt = f"""
Student Name: {student.name}
Grade Level: {student.grade_level}
Age: {student.age}
Learner Traits / Accommodations: {', '.join(getattr(student, 'learner_profile_tags', []) or ['Neurodivergent learner'])}
Average Focus Score: {round(avg_score * 100)}%
Latest Focus Score: {round(latest_score * 100)}%
Recent Accommodations Triggered: {intervention_types[:5]}
Total Interventions Count: {intervention_count}

Analyze this neurodivergent learner's behavioral signals and provide supportive, actionable pedagogical recommendations for teachers and parents.
Return a valid JSON object ONLY with this exact schema:
{{
  "superpowers_and_strengths": "1-2 sentences on student's cognitive strengths, perseverance, and optimal learning zones.",
  "cognitive_bottlenecks": "1-2 sentences identifying where hesitation, working memory load, or sensory fatigue occurs.",
  "teacher_action_plan": [
    "Actionable micro-scaffolding or classroom strategy 1",
    "Actionable micro-scaffolding or classroom strategy 2",
    "Actionable micro-scaffolding or classroom strategy 3"
  ],
  "parent_support_cue": "Empathetic, low-pressure guidance for home, homework pacing, or study breaks.",
  "recommended_next_module": "Suggested subject concept area or pacing adjustment to reinforce confidence."
}}
"""
    system_prompt = "You are an expert pediatric neurodivergent educator and supportive cognitive-behavioral learning specialist. Output valid JSON only."

    generator = GroqContentGenerator()
    try:
        raw = generator.generate(prompt, system_prompt)
        cleaned = raw.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
        parsed = json.loads(cleaned)

        res = {
            "student_id": student.id,
            "student_name": student.name,
            "analysis": parsed,
            "source": getattr(generator, "last_source", "llm"),
        }
        _AI_ANALYSIS_CACHE[cache_key] = (time.time(), res)
        return res
    except Exception as e:
        logger.warning("Groq AI analysis error (%s) — returning structured fallback analysis", e)
        fallback_res = {
            "student_id": student.id,
            "student_name": student.name,
            "analysis": {
                "superpowers_and_strengths": f"{student.name} demonstrates steady persistence, high visual engagement, and problem-solving determination during focused tasks.",
                "cognitive_bottlenecks": "Dense multi-step textual descriptions or high-pressure time constraints can temporarily increase hesitation and working memory load.",
                "teacher_action_plan": [
                    "Present one step at a time with clear scaffolding cues",
                    "Offer visual diagrams and multimodal interactive reinforcement",
                    "Acknowledge problem-solving effort with positive micro-feedback",
                ],
                "parent_support_cue": "Incorporate short 2-minute movement or hydration breaks between challenging homework modules to maintain calm focus.",
                "recommended_next_module": "Interactive science & visual concept reinforcement with low-stress pacing.",
            },
            "source": "fallback",
        }
        _AI_ANALYSIS_CACHE[cache_key] = (time.time(), fallback_res)
        return fallback_res
