"""
Seed script to create 10 mock student profiles and provision their login credentials.
Creates/updates Supabase Auth users (or local fallback) and updates Profile + Student records in PostgreSQL.
"""

import sys
import uuid
from sqlmodel import Session, select
from supabase import create_client

from app.config import get_settings
from app.db.session import get_engine
from app.models.profile import Profile, UserRole
from app.models.student import Student

MOCK_STUDENTS = [
    {
        "name": "Alex Rivera",
        "email": "student1@adaptivetutor.edu",
        "password": "StudentPass123!",
        "age": 10,
        "grade_level": "Grade 5",
        "learner_profile_tags": ["adhd", "visual_learner"],
    },
    {
        "name": "Maya Lin",
        "email": "student2@adaptivetutor.edu",
        "password": "StudentPass123!",
        "age": 11,
        "grade_level": "Grade 6",
        "learner_profile_tags": ["dyslexia", "interactive_learner"],
    },
    {
        "name": "Leo Vance",
        "email": "student3@adaptivetutor.edu",
        "password": "StudentPass123!",
        "age": 9,
        "grade_level": "Grade 4",
        "learner_profile_tags": ["autism", "structured_routine"],
    },
    {
        "name": "Chloe Bennett",
        "email": "student4@adaptivetutor.edu",
        "password": "StudentPass123!",
        "age": 10,
        "grade_level": "Grade 5",
        "learner_profile_tags": ["adhd", "auditory_learner"],
    },
    {
        "name": "Sam Okafor",
        "email": "student5@adaptivetutor.edu",
        "password": "StudentPass123!",
        "age": 12,
        "grade_level": "Grade 7",
        "learner_profile_tags": ["dyscalculia", "visual_learner"],
    },
    {
        "name": "Emily Zhang",
        "email": "student6@adaptivetutor.edu",
        "password": "StudentPass123!",
        "age": 11,
        "grade_level": "Grade 6",
        "learner_profile_tags": ["gifted", "fast_paced"],
    },
    {
        "name": "Noah Miller",
        "email": "student7@adaptivetutor.edu",
        "password": "StudentPass123!",
        "age": 9,
        "grade_level": "Grade 4",
        "learner_profile_tags": ["adhd", "gamified_focus"],
    },
    {
        "name": "Grace Patel",
        "email": "student8@adaptivetutor.edu",
        "password": "StudentPass123!",
        "age": 10,
        "grade_level": "Grade 5",
        "learner_profile_tags": ["anxiety_reduction", "gentle_pacing"],
    },
    {
        "name": "Daniel Kim",
        "email": "student9@adaptivetutor.edu",
        "password": "StudentPass123!",
        "age": 13,
        "grade_level": "Grade 8",
        "learner_profile_tags": ["autism", "stem_focused"],
    },
    {
        "name": "Sophia Rossi",
        "email": "student10@adaptivetutor.edu",
        "password": "StudentPass123!",
        "age": 11,
        "grade_level": "Grade 6",
        "learner_profile_tags": ["dyslexia", "text_to_speech"],
    },
]


def seed_mock_students():
    settings = get_settings()
    engine = get_engine()

    supabase_admin = None
    if settings.supabase_url and settings.supabase_service_role_key:
        try:
            supabase_admin = create_client(
                settings.supabase_url, settings.supabase_service_role_key
            )
            print("[INFO] Connected to Supabase Admin Client.")
        except Exception as exc:
            print(f"[WARN] Could not initialize Supabase Admin Client: {exc}")

    with Session(engine) as db:
        # Find or create a parent profile for student relationship mapping
        parent_profile = db.exec(
            select(Profile).where(Profile.role == UserRole.parent)
        ).first()

        if not parent_profile:
            parent_profile = Profile(
                id=uuid.uuid4(),
                role=UserRole.parent,
                display_name="Demo Parent Guardian",
            )
            db.add(parent_profile)
            db.commit()
            db.refresh(parent_profile)
            print(f"[INFO] Created parent guardian profile: {parent_profile.id}")

        created_students = []

        for data in MOCK_STUDENTS:
            user_id = None
            email = data["email"]
            name = data["name"]
            password = data["password"]

            # Provision in Supabase Auth if available
            if supabase_admin:
                try:
                    res = supabase_admin.auth.admin.create_user(
                        {
                            "email": email,
                            "password": password,
                            "email_confirm": True,
                            "user_metadata": {
                                "role": "student",
                                "display_name": name,
                            },
                        }
                    )
                    user_id = uuid.UUID(str(res.user.id))
                    print(f"[SUCCESS] Provisioned Supabase Auth User: {email} -> {user_id}")
                except Exception as exc:
                    err_msg = str(exc)
                    if "already registered" in err_msg.lower() or "unique" in err_msg.lower() or "already exists" in err_msg.lower():
                        # Fetch existing user list from Supabase
                        try:
                            users_res = supabase_admin.auth.admin.list_users()
                            matched = next(
                                (u for u in users_res if getattr(u, "email", "") == email), None
                            )
                            if matched:
                                user_id = uuid.UUID(str(matched.id))
                                print(f"[INFO] User already registered in Supabase Auth: {email} -> {user_id}")
                                # Ensure password is set to StudentPass123!
                                supabase_admin.auth.admin.update_user_by_id(
                                    str(user_id),
                                    {"password": password}
                                )
                        except Exception as list_exc:
                            print(f"[WARN] Failed listing users from Supabase: {list_exc}")
                    else:
                        print(f"[WARN] Supabase creation note for {email}: {err_msg}")

            if not user_id:
                # Deterministic fallback UUID based on email
                user_id = uuid.uuid5(uuid.NAMESPACE_DNS, email)

            # Ensure Profile exists in DB
            profile = db.get(Profile, user_id)
            if not profile:
                profile = Profile(
                    id=user_id,
                    role=UserRole.student,
                    display_name=name,
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)
            elif profile.display_name != name:
                profile.display_name = name
                db.add(profile)
                db.commit()

            # Ensure Student model exists in DB
            student = db.get(Student, user_id)
            if not student:
                student = Student(
                    id=user_id,
                    profile_id=user_id,
                    name=name,
                    age=data["age"],
                    grade_level=data["grade_level"],
                    learner_profile_tags=data["learner_profile_tags"],
                    parent_id=parent_profile.id,
                )
                db.add(student)
                db.commit()
                db.refresh(student)
            else:
                student.name = name
                student.age = data["age"]
                student.grade_level = data["grade_level"]
                student.learner_profile_tags = data["learner_profile_tags"]
                db.add(student)
                db.commit()

            created_students.append({
                "id": str(user_id),
                "name": name,
                "email": email,
                "password": password,
                "grade": data["grade_level"],
                "age": data["age"],
                "tags": ", ".join(data["learner_profile_tags"]),
            })

        print("\n" + "=" * 80)
        print("SEEDING COMPLETE: 10 Mock Students Successfully Provisioned & Stored in DB")
        print("=" * 80)
        for idx, s in enumerate(created_students, 1):
            print(f"{idx:2d}. Name: {s['name']:<15} | Email: {s['email']:<28} | Password: {s['password']} | Grade: {s['grade']}")
        print("=" * 80)


if __name__ == "__main__":
    seed_mock_students()
