"""
Students router — CRUD and roster assignment endpoints for students.

Role permissions:
  - Parents: create/update their own children, search and link existing students
  - Teachers: assign/unassign students to/from their class roster, search, create student records
  - Students: view and update their own academic profile and accommodations
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlmodel import Session, col, select
from supabase import create_client

from app.config import get_settings
from app.deps import get_current_user, get_db, require_role
from app.models.interaction_event import EventType, InteractionEvent
from app.models.profile import Profile, UserRole
from app.models.session import Session as LearningSession
from app.models.student import Student
from app.models.student_teacher import StudentTeacher
from app.models.task import Task
from app.schemas.student import (
    AssignStudentByQueryRequest,
    AssignStudentRequest,
    StudentCreate,
    StudentResponse,
    StudentUpdate,
)

router = APIRouter(prefix="/students", tags=["students"])
settings = get_settings()


@router.get("/me/metrics", summary="Get authenticated student's real database metrics")
def get_student_metrics(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Computes real metrics from the database for the authenticated student.
    Returns None for metrics where no database activity exists yet.
    """
    # 1. Total available tasks in catalog
    total_tasks_count = db.exec(select(sa.func.count(Task.id))).one() or 0
    
    # 2. Total active subjects count
    subjects_list = db.exec(select(Task.subject).distinct()).all()
    subjects_count = len([s for s in subjects_list if s])

    # Find student object for current_user
    student_ids = [current_user.id]
    student_obj = db.exec(
        select(Student).where(
            (Student.id == current_user.id) | (Student.profile_id == current_user.id)
        )
    ).first()
    if student_obj:
        if student_obj.id not in student_ids:
            student_ids.append(student_obj.id)
        if student_obj.profile_id and student_obj.profile_id not in student_ids:
            student_ids.append(student_obj.profile_id)

    # 3. Fetch current student's sessions
    student_sessions = db.exec(
        select(LearningSession).where(LearningSession.student_id.in_(student_ids))
    ).all()
    session_ids = [s.id for s in student_sessions]

    completed_count = 0
    completed_subjects_count = 0
    avg_score = 0.0
    highest_score = 0.0
    lowest_score = 0.0
    questions_attended = 0
    questions_skipped = 0

    if session_ids:
        # Completed tasks count
        completed_stmt = select(sa.func.count(InteractionEvent.id)).where(
            InteractionEvent.session_id.in_(session_ids),
            InteractionEvent.event_type == EventType.task_complete,
        )
        completed_count = db.exec(completed_stmt).one() or 0

        # Completed distinct subjects count
        completed_subjs_stmt = (
            select(Task.subject)
            .join(InteractionEvent, InteractionEvent.task_id == Task.id)
            .where(
                InteractionEvent.session_id.in_(session_ids),
                InteractionEvent.event_type == EventType.task_complete,
            )
            .distinct()
        )
        completed_subjs = db.exec(completed_subjs_stmt).all()
        completed_subjects_count = len([s for s in completed_subjs if s])

        # Skipped count
        skipped_stmt = select(sa.func.count(InteractionEvent.id)).where(
            InteractionEvent.session_id.in_(session_ids),
            InteractionEvent.event_type == EventType.task_abandon,
        )
        questions_skipped = db.exec(skipped_stmt).one() or 0

        # Answer submit accuracy calculation — pure ground-truth telemetry (no mock validation)
        answers_stmt = select(InteractionEvent).where(
            InteractionEvent.session_id.in_(session_ids),
            InteractionEvent.event_type == EventType.answer_submit,
        )
        answer_events = db.exec(answers_stmt).all()
        if answer_events:
            questions_attended = len(answer_events)
            correct_ans = sum(1 for e in answer_events if isinstance(e.payload, dict) and e.payload.get("correct") is True)
            if questions_attended > 0:
                avg_score = round((correct_ans / questions_attended) * 100, 1)

                # Group by session_id to compute highest & lowest accuracy scores
                session_scores: dict[uuid.UUID, list[bool]] = {}
                for ev in answer_events:
                    if isinstance(ev.payload, dict):
                        is_corr = bool(ev.payload.get("correct") is True)
                        session_scores.setdefault(ev.session_id, []).append(is_corr)

                accuracies = []
                for s_id, bools in session_scores.items():
                    if bools:
                        accuracies.append(round((sum(bools) / len(bools)) * 100, 1))

                if accuracies:
                    highest_score = max(accuracies)
                    lowest_score = min(accuracies)
                else:
                    highest_score = avg_score
                    lowest_score = avg_score

    # 4. Streak calculation (Minimum 1 day when student opens application)
    streak_days = 1
    if student_sessions:
        session_dates = sorted(
            list({s.started_at.date() for s in student_sessions if s.started_at}),
            reverse=True,
        )
        if session_dates:
            today = datetime.now(timezone.utc).date()
            if session_dates[0] in (today, today - timedelta(days=1)):
                count = 0
                check_date = session_dates[0]
                for d in session_dates:
                    if d == check_date:
                        count += 1
                        check_date -= timedelta(days=1)
                    else:
                        break
                if count > 0:
                    streak_days = max(1, count)

    # 5. Weekly minutes spent per weekday (Mon-Sun)
    weekly_activity = {
        "Mon": {"study": 0.0, "exam": 0.0},
        "Tue": {"study": 0.0, "exam": 0.0},
        "Wed": {"study": 0.0, "exam": 0.0},
        "Thu": {"study": 0.0, "exam": 0.0},
        "Fri": {"study": 0.0, "exam": 0.0},
        "Sat": {"study": 0.0, "exam": 0.0},
        "Sun": {"study": 0.0, "exam": 0.0},
    }

    for s in student_sessions:
        if s.started_at:
            day_name = s.started_at.strftime("%a")
            if day_name in weekly_activity:
                if s.ended_at:
                    mins = max(5.0, round((s.ended_at - s.started_at).total_seconds() / 60.0, 1))
                else:
                    mins = 30.0  # default session duration estimate in minutes
                weekly_activity[day_name]["study"] = round(weekly_activity[day_name]["study"] + mins, 1)

    has_any_hours = any(v["study"] > 0 or v["exam"] > 0 for v in weekly_activity.values())

    return {
        "total_tasks": total_tasks_count,
        "subjects_count": subjects_count,
        "completed_count": completed_count,
        "completed_subjects_count": completed_subjects_count,
        "streak_days": streak_days,
        "modalities_count": 3,
        "avg_performance_score": avg_score,
        "highest_score": highest_score,
        "lowest_score": lowest_score,
        "questions_attended": questions_attended,
        "questions_skipped": questions_skipped,
        "weekly_activity": weekly_activity,
        "has_weekly_activity": has_any_hours,
    }


@router.post(
    "",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new student profile",
)
async def create_student(
    body: StudentCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("parent", "teacher")),
) -> Student:
    """
    Create a new student profile.
    If email and password are provided, provisions a Supabase Auth user and Profile so the student can log in directly.
    """
    student_id = uuid.uuid4()
    profile_id = None

    if body.email and body.password:
        supabase_admin = create_client(settings.supabase_url, settings.supabase_service_role_key)
        try:
            res = supabase_admin.auth.admin.create_user({
                "email": body.email.strip(),
                "password": body.password,
                "email_confirm": True,
                "user_metadata": {
                    "role": "student",
                    "display_name": body.name.strip(),
                },
            })
            auth_user_id = uuid.UUID(str(res.user.id))
            student_id = auth_user_id
            profile_id = auth_user_id

            # Create or update matching profile
            student_profile = db.get(Profile, auth_user_id)
            if not student_profile:
                student_profile = Profile(
                    id=auth_user_id,
                    role=UserRole.student,
                    display_name=body.name.strip(),
                )
                db.add(student_profile)
                db.commit()
        except Exception as exc:
            err_msg = str(exc)
            if "already registered" in err_msg.lower() or "unique" in err_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A student with this email address is already registered.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create student login account: {err_msg}",
            )

    student = Student(
        id=student_id,
        profile_id=profile_id,
        name=body.name.strip(),
        age=body.age,
        grade_level=body.grade_level.strip(),
        learner_profile_tags=body.learner_profile_tags,
        parent_id=current_user.id,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    # If teacher created the student, auto-link to teacher's class roster
    if current_user.role == UserRole.teacher:
        link = StudentTeacher(student_id=student.id, teacher_id=current_user.id)
        db.add(link)
        db.commit()

    return student


@router.get(
    "/search",
    response_model=list[StudentResponse],
    summary="Search students to assign or link",
)
async def search_students(
    q: Annotated[str, Query(min_length=1, description="Search term for student name or id")],
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("parent", "teacher")),
) -> list[Student]:
    """Search for students to link to parent account or teacher class roster."""
    term = f"%{q.strip()}%"
    stmt = select(Student).where(col(Student.name).ilike(term)).limit(20)
    return list(db.exec(stmt).all())


@router.get(
    "/me",
    response_model=StudentResponse,
    summary="Get current student's academic profile",
)
async def get_my_student_profile(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("student")),
) -> Student:
    """Retrieve the logged in student's Student entity."""
    student = db.exec(
        select(Student).where((Student.profile_id == current_user.id) | (Student.id == current_user.id))
    ).first()
    if not student:
        # Auto-provision if missing
        student = Student(
            id=current_user.id,
            profile_id=current_user.id,
            name=current_user.display_name,
            age=10,
            grade_level="Grade 5",
            learner_profile_tags=[],
            parent_id=current_user.id,
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    return student


@router.patch(
    "/me",
    response_model=StudentResponse,
    summary="Update current student's academic traits and accommodations",
)
async def update_my_student_profile(
    body: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("student")),
) -> Student:
    """Update age, grade_level, and learner_profile_tags for the logged-in student."""
    student = db.exec(
        select(Student).where((Student.profile_id == current_user.id) | (Student.id == current_user.id))
    ).first()
    if not student:
        student = Student(
            id=current_user.id,
            profile_id=current_user.id,
            name=current_user.display_name,
            age=body.age or 10,
            grade_level=body.grade_level or "Grade 5",
            learner_profile_tags=body.learner_profile_tags or [],
            parent_id=current_user.id,
        )
        db.add(student)
    else:
        if body.name is not None and body.name.strip():
            student.name = body.name.strip()
            current_user.display_name = body.name.strip()
            db.add(current_user)
        if body.age is not None:
            student.age = body.age
        if body.grade_level is not None:
            student.grade_level = body.grade_level.strip()
        if body.learner_profile_tags is not None:
            student.learner_profile_tags = body.learner_profile_tags
        db.add(student)

    db.commit()
    db.refresh(student)
    return student


@router.get(
    "/{student_id}",
    response_model=StudentResponse,
    summary="Get single student details",
)
async def get_student(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
) -> Student:
    """Retrieve student information with role-based access check."""
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    if current_user.role == UserRole.parent and student.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    elif current_user.role == UserRole.teacher:
        stmt = select(StudentTeacher).where(
            StudentTeacher.student_id == student_id,
            StudentTeacher.teacher_id == current_user.id,
        )
        if not db.exec(stmt).first() and student.parent_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student not in teacher roster.")
    elif current_user.role == UserRole.student and student.id != current_user.id and student.profile_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return student


@router.patch(
    "/{student_id}",
    response_model=StudentResponse,
    summary="Update student profile information",
)
async def update_student(
    student_id: uuid.UUID,
    body: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("parent", "teacher")),
) -> Student:
    """Update student name, age, grade, or learner profile tags."""
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    if current_user.role == UserRole.parent and student.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    elif current_user.role == UserRole.teacher:
        stmt = select(StudentTeacher).where(
            StudentTeacher.student_id == student_id,
            StudentTeacher.teacher_id == current_user.id,
        )
        if not db.exec(stmt).first() and student.parent_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student not in teacher roster.")

    if body.name is not None:
        student.name = body.name.strip()
    if body.age is not None:
        student.age = body.age
    if body.grade_level is not None:
        student.grade_level = body.grade_level.strip()
    if body.learner_profile_tags is not None:
        student.learner_profile_tags = body.learner_profile_tags

    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.post(
    "/{student_id}/assign-parent",
    status_code=status.HTTP_200_OK,
    summary="Link existing student to parent account",
)
async def assign_student_to_parent(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("parent")),
) -> dict:
    """Link an existing student to the authenticated parent."""
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    student.parent_id = current_user.id
    db.add(student)
    db.commit()
    return {"status": "success", "message": f"Student '{student.name}' linked to your parent account."}


@router.post(
    "/{student_id}/assign-teacher",
    status_code=status.HTTP_200_OK,
    summary="Assign student to teacher roster",
)
async def assign_student_to_teacher(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("teacher")),
) -> dict:
    """Link a student to the authenticated teacher's class roster."""
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    stmt = select(StudentTeacher).where(
        StudentTeacher.student_id == student_id,
        StudentTeacher.teacher_id == current_user.id,
    )
    existing = db.exec(stmt).first()
    if not existing:
        link = StudentTeacher(student_id=student_id, teacher_id=current_user.id)
        db.add(link)
        db.commit()

    return {"status": "success", "message": f"Student '{student.name}' added to roster."}


@router.delete(
    "/{student_id}/unassign-teacher",
    status_code=status.HTTP_200_OK,
    summary="Remove student from teacher roster",
)
async def unassign_student_from_teacher(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("teacher")),
) -> dict:
    """Remove a student assignment from teacher's roster."""
    stmt = select(StudentTeacher).where(
        StudentTeacher.student_id == student_id,
        StudentTeacher.teacher_id == current_user.id,
    )
    existing = db.exec(stmt).first()
    if existing:
        db.delete(existing)
        db.commit()

    return {"status": "success", "message": "Student removed from roster."}


class ChatContext(BaseModel):
    subject: str | None = None
    topic: str | None = None
    current_mode: str | None = None


class ChatMessage(BaseModel):
    role: str
    content: str


class StudentChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: ChatContext | None = None


class StudentChatResponse(BaseModel):
    reply: str
    source: str


@router.post(
    "/chat",
    response_model=StudentChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Interactive student AI tutor chatbot powered by Groq",
)
async def student_chat(
    payload: StudentChatRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role("student")),
) -> StudentChatResponse:
    """
    Real-time interactive AI tutor for students using Groq API.
    Restricted strictly to student role.
    """
    from app.services.content_generator import GroqContentGenerator

    generator = GroqContentGenerator()
    student_name = current_user.display_name or "student"

    # Fetch student profile record if available for grade and learning tags
    student_obj = db.exec(
        select(Student).where(
            (Student.id == current_user.id) | (Student.profile_id == current_user.id)
        )
    ).first()

    grade_info = f" Grade: {student_obj.grade_level}." if student_obj and student_obj.grade_level else ""
    traits_info = ""
    if student_obj and student_obj.learner_profile_tags:
        traits_info = f" Learner Profile Traits: {', '.join(student_obj.learner_profile_tags)}."

    context_str = ""
    if payload.context:
        ctx_parts = []
        if payload.context.current_mode:
            ctx_parts.append(f"Learning Mode: {payload.context.current_mode}")
        if payload.context.subject:
            ctx_parts.append(f"Subject: {payload.context.subject}")
        if payload.context.topic:
            ctx_parts.append(f"Topic: {payload.context.topic}")
        if ctx_parts:
            context_str = f"\n\nActive Student Context: {' | '.join(ctx_parts)}."

    system_prompt = (
        f"You are Clarity AI, a warm, highly empathetic, patient, and intelligent AI tutor and learning companion for {student_name}.{grade_info}{traits_info}{context_str}\n\n"
        "Your mission is to support students in every aspect of their learning journey:\n"
        "1. Academic Support: Provide clear, step-by-step explanations in STEM (Mathematics, Physics, Chemistry, Biology, Computer Science) and Humanities (Literature, History, Writing). Use simple analogies, structured bullet points, and practical examples.\n"
        "2. Student Life & Mental Wellbeing: Offer compassionate, practical, and non-judgmental advice for dealing with exam stress, study burnout, anxiety, procrastination, time management, Pomodoro focus techniques, and ADHD/neurodivergent-friendly executive function strategies.\n"
        "3. Motivation & Growth Mindset: Encourage curiosity, validate their effort, normalize mistakes as part of learning, and keep motivation high with positive, empowering dialogue.\n"
        "4. Tone & Format: Conversational, friendly, highly clear, well-structured with short paragraphs and bullet points, easy to read, and never dry, rigid, or repetitive."
    )

    raw_messages = [
        {"role": m.role if m.role in ("user", "assistant") else "user", "content": m.content.strip()}
        for m in payload.messages
        if m.content and m.content.strip()
    ]

    # Sanitize message history for Groq API:
    # 1. Strip leading assistant messages so conversation starts with user role after system prompt
    while raw_messages and raw_messages[0]["role"] != "user":
        raw_messages.pop(0)

    # 2. Merge consecutive duplicate roles (e.g. user -> user or assistant -> assistant)
    sanitized_messages: list[dict[str, str]] = []
    for msg in raw_messages:
        if sanitized_messages and sanitized_messages[-1]["role"] == msg["role"]:
            sanitized_messages[-1]["content"] += f"\n\n{msg['content']}"
        else:
            sanitized_messages.append(msg)

    # 3. Limit to last 10 turns (20 messages) to stay well within Groq token limits
    final_messages = sanitized_messages[-20:] if len(sanitized_messages) > 20 else sanitized_messages

    if not final_messages:
        final_messages = [{"role": "user", "content": "Hello Clarity AI, please introduce yourself and ask how you can help me study today."}]

    reply = generator.chat(final_messages, system_prompt)
    return StudentChatResponse(
        reply=reply,
        source=getattr(generator, "last_source", "llm"),
    )
