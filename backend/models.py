from datetime import datetime

from sqlalchemy import (
    Column,
    Float,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Boolean,
)

from database import Base


# ============================================================
# USER
# ============================================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        index=True
    )

    password = Column(
        String,
        nullable=False
    )

    is_verified = Column(
        Boolean,
        default=False
    )

    otp_code = Column(
        String,
        nullable=True
    )

    otp_expires_at = Column(
        DateTime,
        nullable=True
    )


# ============================================================
# NOTES
# ============================================================

class Note(Base):

    __tablename__ = "notes"

    id = Column(
        Integer,
        primary_key=True
    )

    title = Column(
        String
    )

    content = Column(
        Text
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user_id = Column(
        Integer
    )


# ============================================================
# STUDY PLAN
# ============================================================

class StudyPlan(Base):

    __tablename__ = "study_plans"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    exam = Column(
        String,
        nullable=False
    )

    today = Column(
        String
    )

    exam_date = Column(
        String
    )

    days_remaining = Column(
        Integer
    )

    hours_per_day = Column(
        Float
    )

    mode = Column(
        String,
        default="ai"
    )

    plan_data = Column(
        Text
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ============================================================
# STUDY TASK
# ============================================================

class StudyTask(Base):

    __tablename__ = "study_tasks"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    plan_id = Column(
        Integer,
        ForeignKey("study_plans.id"),
        nullable=False,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    day = Column(
        Integer
    )

    date = Column(
        String
    )

    subject = Column(
        String
    )

    topic = Column(
        String
    )

    activity = Column(
        String
    )

    hours = Column(
        Float
    )

    completed = Column(
        Integer,
        default=0
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ============================================================
# SAVED QUIZ
# ============================================================

class SavedQuiz(Base):

    __tablename__ = "saved_quizzes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # --------------------------------------------------------
    # Owner
    # --------------------------------------------------------

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # --------------------------------------------------------
    # Quiz information
    # --------------------------------------------------------

    exam = Column(
        String,
        nullable=False
    )

    subject = Column(
        String,
        nullable=False
    )

    topic = Column(
        String,
        nullable=False
    )

    difficulty = Column(
        String,
        default="Medium"
    )

    question_count = Column(
        Integer,
        default=0
    )

    # --------------------------------------------------------
    # Quiz data
    #
    # Stores:
    # questions
    # options
    # correct answers
    # explanations
    # selected answers
    # --------------------------------------------------------

    quiz_data = Column(
        Text,
        nullable=False
    )

    # --------------------------------------------------------
    # Result
    # --------------------------------------------------------

    score = Column(
        Integer,
        default=0
    )

    percentage = Column(
        Float,
        default=0
    )

    # --------------------------------------------------------
    # Created date
    # --------------------------------------------------------

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
