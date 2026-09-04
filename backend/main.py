from datetime import datetime, timedelta
import os
import random
import json

from pydantic import BaseModel, Field

from fastapi import (
    FastAPI,
    Depends,
    Header,
    HTTPException
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, SessionLocal
from models import Base, User, Note, StudyPlan, StudyTask

from subscription import Subscription, AIUsage
from subscription_service import (
    check_quota,
    get_user_plan,
    get_usage_summary,
    record_ai_usage
)

from schemas import UserCreate, UserLogin, NoteCreate
from ai import generate_mcqs, generate_study_plan
from ai_notes import generate_notes
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from email_utils import send_otp_email


# ============================================================
# CONFIG
# ============================================================

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL")

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not configured.")

if not FRONTEND_URL:
    raise RuntimeError("FRONTEND_URL environment variable is not configured.")


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="ExamAce AI",
    version="2.0"
)

Base.metadata.create_all(bind=engine)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# ============================================================
# DATABASE
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
            detail="Authentication required."
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header."
        )

    token = authorization[7:].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token."
            )

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found."
        )

    return user


# ============================================================
# REQUEST MODELS
# ============================================================

class MCQRequest(BaseModel):
    topic: str
    difficulty: str = "Medium"
    count: int = Field(default=5, ge=1, le=20)
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
    plan_data: dict


class ManualTaskRequest(BaseModel):
    day: int
    date: str
    subject: str
    topic: str
    activity: str
    hours: float


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


class ResendOTPRequest(BaseModel):
    email: str


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():
    return {
        "message": "ExamAce AI API is running"
    }


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {
        "message": "Dashboard data",
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
    }


# ============================================================
# NOTES
# ============================================================

@app.post("/notes")
def create_note(
    data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = Note(
        user_id=current_user.id,
        title=data.title,
        content=data.content
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "message": "Note saved successfully",
        "note_id": note.id
    }


@app.get("/notes")
def get_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notes = (
        db.query(Note)
        .filter(Note.user_id == current_user.id)
        .order_by(Note.id.desc())
        .all()
    )

    return [
        {
            "id": note.id,
            "title": note.title,
            "content": note.content,
        }
        for note in notes
    ]


# ============================================================
# MCQ GENERATOR
# ============================================================

@app.post("/generate-mcq")
def generate_mcq(
    data: MCQRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not data.topic.strip():
        raise HTTPException(
            status_code=400,
            detail="Topic is required."
        )

    if not data.difficulty.strip():
        raise HTTPException(
            status_code=400,
            detail="Difficulty is required."
        )

    check_quota(
        db=db,
        user_id=current_user.id,
        feature="mcq",
        units=data.count
    )

    try:
        result = generate_mcqs(
            topic=data.topic.strip(),
            difficulty=data.difficulty.strip(),
            count=data.count,
            subject=data.subject.strip(),
            exam=data.exam.strip()
        )

        if isinstance(result, tuple):
            content = result[0]
            input_tokens = result[1] if len(result) > 1 else 0
            output_tokens = result[2] if len(result) > 2 else 0
        else:
            content = result
            input_tokens = 0
            output_tokens = 0

        record_ai_usage(
            db=db,
            user_id=current_user.id,
            feature="mcq",
            units=data.count,
            model="gemini-2.5-flash",
            input_tokens=input_tokens or 0,
            output_tokens=output_tokens or 0
        )

        return content

    except HTTPException:
        raise
    except Exception as error:
        print("MCQ generation error:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate MCQs."
        )


# ============================================================
# STUDY PLAN GENERATOR
# ============================================================

@app.post("/generate-plan")
def generate_plan(
    data: StudyPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.days_remaining <= 0:
        raise HTTPException(
            status_code=400,
            detail="Days remaining must be greater than zero."
        )

    if data.hours_per_day <= 0:
        raise HTTPException(
            status_code=400,
            detail="Hours per day must be greater than zero."
        )

    if not data.subjects:
        raise HTTPException(
            status_code=400,
            detail="At least one subject is required."
        )

    check_quota(
        db=db,
        user_id=current_user.id,
        feature="planner",
        units=1
    )

    try:
        result = generate_study_plan(
            exam=data.exam,
            today=data.today,
            exam_date=data.exam_date,
            days_remaining=data.days_remaining,
            hours_per_day=data.hours_per_day,
            subjects=data.subjects
        )

        if isinstance(result, tuple):
            content = result[0]
            input_tokens = result[1] if len(result) > 1 else 0
            output_tokens = result[2] if len(result) > 2 else 0
        else:
            content = result
            input_tokens = 0
            output_tokens = 0

        record_ai_usage(
            db=db,
            user_id=current_user.id,
            feature="planner",
            units=1,
            model="gemini-2.5-flash",
            input_tokens=input_tokens or 0,
            output_tokens=output_tokens or 0
        )

        return {
            "content": content
        }

    except HTTPException:
        raise
    except Exception as error:
        print("Study plan generation error:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate study plan."
        )


# ============================================================
# SAVE PLAN
# ============================================================

@app.post("/save-plan")
def save_plan(
    data: SavePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_plans = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == current_user.id)
        .all()
    )

    for plan in existing_plans:
        db.query(StudyTask).filter(
            StudyTask.plan_id == plan.id
        ).delete(synchronize_session=False)
        db.delete(plan)

    db.commit()

    plan = StudyPlan(
        user_id=current_user.id,
        plan_data=json.dumps(data.plan_data)
    )

    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "message": "Study plan saved successfully",
        "plan_id": plan.id
    }


# ============================================================
# GET SAVED PLAN
# ============================================================

@app.get("/my-plan")
def get_my_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == current_user.id)
        .order_by(StudyPlan.id.desc())
        .first()
    )

    if not plan:
        return {
            "plan": None,
            "tasks": []
        }

    tasks = (
        db.query(StudyTask)
        .filter(
            StudyTask.user_id == current_user.id,
            StudyTask.plan_id == plan.id
        )
        .order_by(StudyTask.date, StudyTask.id)
        .all()
    )

    try:
        plan_data = json.loads(plan.plan_data)
    except Exception:
        plan_data = plan.plan_data

    return {
        "plan": plan_data,
        "tasks": [
            {
                "id": task.id,
                "day": task.day,
                "date": task.date,
                "subject": task.subject,
                "topic": task.topic,
                "activity": task.activity,
                "hours": task.hours,
                "completed": bool(task.completed),
            }
            for task in tasks
        ]
    }


# ============================================================
# STUDY TASKS
# ============================================================

@app.post("/study-task")
def create_study_task(
    data: ManualTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == current_user.id)
        .order_by(StudyPlan.id.desc())
        .first()
    )

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Study plan not found"
        )

    task = StudyTask(
        plan_id=plan.id,
        user_id=current_user.id,
        day=data.day,
        date=data.date,
        subject=data.subject,
        topic=data.topic,
        activity=data.activity,
        hours=data.hours,
        completed=0
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return {
        "message": "Task created",
        "task_id": task.id
    }


@app.patch("/study-task/{task_id}")
def update_study_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = (
        db.query(StudyTask)
        .filter(
            StudyTask.id == task_id,
            StudyTask.user_id == current_user.id
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    task.completed = 0 if task.completed else 1

    db.commit()
    db.refresh(task)

    return {
        "message": "Task updated",
        "task_id": task.id,
        "completed": bool(task.completed)
    }


@app.delete("/study-task/{task_id}")
def delete_study_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = (
        db.query(StudyTask)
        .filter(
            StudyTask.id == task_id,
            StudyTask.user_id == current_user.id
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully"
    }


# ============================================================
# STUDY PLAN PROGRESS
# ============================================================

@app.get("/study-progress")
def study_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = (
        db.query(StudyTask)
        .filter(StudyTask.user_id == current_user.id)
        .all()
    )

    total_tasks = len(tasks)
    completed_tasks = sum(1 for task in tasks if task.completed)
    total_hours = sum(task.hours or 0 for task in tasks)
    completed_hours = sum(
        task.hours or 0
        for task in tasks
        if task.completed
    )

    progress = (
        round(completed_tasks / total_tasks * 100)
        if total_tasks
        else 0
    )

    hour_progress = (
        round(completed_hours / total_hours * 100)
        if total_hours
        else 0
    )

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "remaining_tasks": total_tasks - completed_tasks,
        "total_hours": total_hours,
        "completed_hours": completed_hours,
        "remaining_hours": total_hours - completed_hours,
        "task_progress": progress,
        "hour_progress": hour_progress
    }


# ============================================================
# DELETE ENTIRE STUDY PLAN
# ============================================================

@app.delete("/my-plan")
def delete_my_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plans = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == current_user.id)
        .all()
    )

    for plan in plans:
        db.query(StudyTask).filter(
            StudyTask.plan_id == plan.id
        ).delete(synchronize_session=False)
        db.delete(plan)

    db.commit()

    return {
        "message": "Study plan deleted"
    }


# ============================================================
# QUIZ
# ============================================================

@app.post("/generate-quiz")
def generate_quiz(
    data: MCQRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Temporary quiz implementation.
    # It is authenticated but does not consume AI quota because it
    # currently does not call Gemini.
    questions = []

    for i in range(data.count):
        questions.append({
            "question": f"{data.topic} Question {i + 1}",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "answer": random.choice(["A", "B", "C", "D"])
        })

    return {
        "questions": questions
    }


# ============================================================
# AI NOTES
# ============================================================

@app.post("/generate-notes")
def notes_generator(
    data: NotesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not data.topic.strip():
        raise HTTPException(
            status_code=400,
            detail="Topic is required."
        )

    check_quota(
        db=db,
        user_id=current_user.id,
        feature="notes",
        units=1
    )

    try:
        result = generate_notes(data.topic.strip())

        if isinstance(result, tuple):
            content = result[0]
            input_tokens = result[1] if len(result) > 1 else 0
            output_tokens = result[2] if len(result) > 2 else 0
        else:
            content = result
            input_tokens = 0
            output_tokens = 0

        record_ai_usage(
            db=db,
            user_id=current_user.id,
            feature="notes",
            units=1,
            model="gemini-2.5-flash",
            input_tokens=input_tokens or 0,
            output_tokens=output_tokens or 0
        )

        return {
            "content": content
        }

    except HTTPException:
        raise
    except Exception as error:
        print("Notes generation error:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate notes."
        )


# ============================================================
# SUBSCRIPTION
# ============================================================

@app.get("/subscription")
def subscription_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subscription = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .first()
    )

    if not subscription:
        subscription = Subscription(
            user_id=current_user.id,
            plan="free",
            status="active"
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)

    plan = get_user_plan(db, current_user.id)
    db.refresh(subscription)

    return {
        "plan": plan,
        "status": subscription.status,
        "started_at": subscription.started_at,
        "expires_at": subscription.expires_at
    }


# ============================================================
# AI USAGE
# ============================================================

@app.get("/usage")
def usage_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_usage_summary(db, current_user.id)


# ============================================================
# REGISTER
# ============================================================

@app.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        return {
            "error": "Email already exists"
        }

    otp_code = f"{random.randint(0, 999999):06d}"
    otp_expiry = datetime.utcnow() + timedelta(minutes=10)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        is_verified=False,
        otp_code=otp_code,
        otp_expires_at=otp_expiry,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    subscription = Subscription(
        user_id=new_user.id,
        plan="free",
        status="active"
    )

    db.add(subscription)
    db.commit()

    email_sent = send_otp_email(
        new_user.email,
        otp_code
    )

    return {
        "message": (
            "User created. Please check your email for a verification code."
            if email_sent
            else "User created, but the verification email could not be sent. Please contact support."
        ),
        "user_id": new_user.id
    }


# ============================================================
# VERIFY OTP
# ============================================================

@app.post("/verify-otp")
def verify_otp(
    data: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    if user.is_verified:
        return {
            "message": "Email already verified."
        }

    if not user.otp_code or user.otp_code != data.otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification code."
        )

    if user.otp_expires_at and datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please request a new one."
        )

    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None

    db.commit()

    return {
        "message": "Email verified successfully! You can now log in."
    }


# ============================================================
# RESEND OTP
# ============================================================

@app.post("/resend-otp")
def resend_otp(
    data: ResendOTPRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    if user.is_verified:
        return {
            "message": "Email already verified."
        }

    otp_code = f"{random.randint(0, 999999):06d}"
    user.otp_code = otp_code
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)

    db.commit()

    email_sent = send_otp_email(
        user.email,
        otp_code
    )

    return {
        "message": (
            "A new verification code has been sent."
            if email_sent
            else "Could not send verification code. Please try again."
        )
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    db_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not db_user.is_verified:
        return {
            "error": "Please verify your email before logging in.",
            "unverified": True,
            "email": db_user.email
        }

    token = create_access_token({
        "user_id": db_user.id
    })

    return {
        "access_token": token,
        "user_id": db_user.id,
        "name": db_user.name
    }
