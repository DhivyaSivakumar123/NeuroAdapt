"""
StudentTeacher — many-to-many join table.
A teacher can have multiple assigned students; a student can have multiple teachers.
Composite primary key (student_id, teacher_id).
"""

import uuid

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class StudentTeacher(SQLModel, table=True):
    __tablename__ = "student_teacher"

    student_id: uuid.UUID = Field(
        sa_column=sa.Column(
            sa.UUID(as_uuid=True),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        )
    )
    teacher_id: uuid.UUID = Field(
        sa_column=sa.Column(
            sa.UUID(as_uuid=True),
            sa.ForeignKey("profiles.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        )
    )
