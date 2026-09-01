from datetime import datetime
import random
import json
import secrets

from pydantic import BaseModel, Field
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

from database import engine, SessionLocal

from models import (
    Base,
    User,
    Note,
    StudyPlan,
    StudyTask,
)

from schemas import (
    UserCreate,
    UserLogin,
    NoteCreate,
)

from ai import (
    generate_mcqs,
    generate_study_plan,
)

from ai_notes import generate_notes

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

# NEW: email sending helper
from email_utils import send_verification_email


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="ExamAce AI",
    version="2.0"
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE SESSION
# ============================================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# REQUEST MODELS
# ============================================================

class MCQRequest(BaseModel):

    topic: str

    difficulty: str = "Medium"

    count: int = Field(
        default=5,
        ge=1,
        le=20
    )

    subject: str = "General"

    exam: str = "General"


class NotesRequest(BaseModel):

    topic: str


class StudyPlanRequest(BaseModel):

    exam: str

    today: str

    exam_date: str

    days_remaining: int

    hours_per_day: float

    subjects: list


class SavePlanRequest(BaseModel):

    exam: str

    today: str

    exam_date: str

    days_remaining: int

    hours_per_day: float

    mode: str = "ai"

    plan_data: dict


class ManualTaskRequest(BaseModel):

    text: str

    subject: str

    date: str

    hours: float = Field(
        ge=0.5,
        le=24
    )


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "ExamAce AI Backend Running",
        "version": "2.0"
    }


# ============================================================
# AUTHENTICATION
# ============================================================

def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):

    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    token = authorization.replace(
        "Bearer ",
        ""
    )

    payload = decode_access_token(token)

    if not payload:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user_id = payload.get("user_id")

    if not user_id:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    notes = (
        db.query(Note)
        .filter(
            Note.user_id ==
            current_user.id
        )
        .order_by(
            Note.id.desc()
        )
        .all()
    )

    plans = (
        db.query(StudyPlan)
        .filter(
            StudyPlan.user_id ==
            current_user.id
        )
        .order_by(
            StudyPlan.id.desc()
        )
        .all()
    )

    tasks = (
        db.query(StudyTask)
        .filter(
            StudyTask.user_id ==
            current_user.id
        )
        .all()
    )

    completed_tasks = sum(
        1
        for task in tasks
        if task.completed
    )

    progress = (
        round(
            completed_tasks /
            len(tasks) * 100
        )
        if tasks
        else 0
    )

    return {

        "total_notes":
            len(notes),

        "total_plans":
            len(plans),

        "total_tasks":
            len(tasks),

        "completed_tasks":
            completed_tasks,

        "progress":
            progress,

        "recent_notes": [

            {
                "id": note.id,
                "title": note.title
            }

            for note in notes[:5]

        ]

    }


# ============================================================
# NOTES
# ============================================================

@app.post("/notes")
def create_note(
    note: NoteCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):

    new_note = Note(

        title=note.title,

        content=note.content,

        user_id=current_user.id

    )

    db.add(new_note)

    db.commit()

    db.refresh(new_note)

    return new_note


@app.get("/notes")
def get_notes(
    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):

    return (
        db.query(Note)
        .filter(
            Note.user_id ==
            current_user.id
        )
        .order_by(
            Note.id.desc()
        )
        .all()
    )


# ============================================================
# MCQ GENERATOR
# ============================================================

@app.post("/generate-mcq")
def generate_mcq(
    data: MCQRequest
):

    if not data.topic.strip():

        raise HTTPException(
            status_code=400,
            detail="Topic is required."
        )

    if data.difficulty not in [
        "Easy",
        "Medium",
        "Hard"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Invalid difficulty."
        )

    try:

        result = generate_mcqs(

            topic=data.topic.strip(),

            difficulty=data.difficulty,

            count=data.count,

            subject=data.subject,

            exam=data.exam

        )

        return result

    except ValueError as error:

        raise HTTPException(

            status_code=500,

            detail=str(error)

        )

    except Exception as error:

        print(
            "MCQ generation error:",
            error
        )

        raise HTTPException(

            status_code=500,

            detail="Failed to generate MCQs."

        )


# ============================================================
# AI STUDY PLAN GENERATION
# ============================================================

@app.post("/generate-plan")
def generate_plan(
    data: StudyPlanRequest,

    current_user: User = Depends(
        get_current_user
    )
):

    if data.days_remaining <= 0:

        raise HTTPException(
            status_code=400,
            detail="Exam date must be in the future."
        )

    if data.hours_per_day <= 0:

        raise HTTPException(
            status_code=400,
            detail="Study hours must be greater than zero."
        )

    if not data.subjects:

        raise HTTPException(
            status_code=400,
            detail="At least one subject is required."
        )

    plan = generate_study_plan(

        data.exam,

        data.today,

        data.exam_date,

        data.days_remaining,

        data.hours_per_day,

        data.subjects,

    )

    return {

        "content":
            plan

    }


# ============================================================
# SAVE STUDY PLAN
# ============================================================

@app.post("/save-plan")
def save_plan(

    data: SavePlanRequest,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # Delete previous plans
    # --------------------------------------------------------

    old_plans = (

        db.query(StudyPlan)

        .filter(

            StudyPlan.user_id ==
            current_user.id

        )

        .all()

    )

    for old_plan in old_plans:

        db.query(StudyTask).filter(

            StudyTask.plan_id ==
            old_plan.id

        ).delete(

            synchronize_session=False

        )

        db.delete(old_plan)

    db.commit()


    # --------------------------------------------------------
    # Create new plan
    # --------------------------------------------------------

    new_plan = StudyPlan(

        user_id=current_user.id,

        exam=data.exam,

        today=data.today,

        exam_date=data.exam_date,

        days_remaining=data.days_remaining,

        hours_per_day=data.hours_per_day,

        mode=data.mode,

        plan_data=json.dumps(
            data.plan_data
        ),

    )

    db.add(new_plan)

    db.commit()

    db.refresh(new_plan)


    # --------------------------------------------------------
    # Extract daily plan
    # --------------------------------------------------------

    daily_plan =
