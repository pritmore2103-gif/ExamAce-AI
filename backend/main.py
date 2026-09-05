from auth import (
    hash_password,
    verify_password,
    is_legacy_password_hash,
    create_access_token,
    decode_access_token,
)

from datetime import datetime, timedelta, timezone
import os
import random
import json
import secrets

from pydantic import BaseModel, Field

from fastapi import (
    FastAPI,
    Depends,
    Header,
    HTTPException,
    Request,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, SessionLocal
from models import Base, User, Note, StudyPlan, StudyTask

from subscription import Subscription, AIUsage
from subscription_service import (
    get_user_plan,
    get_usage_summary,
    record_ai_usage,
    reserve_quota,
    release_quota,
)

from payment import (
    RazorpaySubscription,
    RAZORPAY_KEY_ID,
    RAZORPAY_PLAN_ID,
    create_razorpay_subscription,
    fetch_razorpay_subscription,
    cancel_razorpay_subscription,
    verify_checkout_signature,
    verify_webhook_signature,
    unix_to_datetime,
)

from schemas import UserCreate, UserLogin, NoteCreate
from ai import generate_mcqs, generate_study_plan
from ai_notes import generate_notes

from email_utils import send_otp_email


# ============================================================
# OTP SECURITY
# ============================================================

OTP_EXPIRY_MINUTES = 10
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_RESENDS_PER_HOUR = 5
OTP_MAX_VERIFY_ATTEMPTS = 5


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
# ADMIN AUTHENTICATION
#
# Defined below get_current_user() since it depends on it.
# ============================================================

def get_current_admin(
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    return current_user


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
    if not data.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Note title is required."
        )

    if not data.content.strip():
        raise HTTPException(
            status_code=400,
            detail="Note content is required."
        )

    note = Note(
        user_id=current_user.id,
        title=data.title.strip(),
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

    reserve_quota(
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
        release_quota(
            db=db,
            user_id=current_user.id,
            feature="mcq",
            units=data.count
        )

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

    reserve_quota(
        db=db,
        user_id=current_user.id,
        feature="planner",
        units=1
    )

    try:
        result = generate_study_plan(
            data.exam,
            data.today,
            data.exam_date,
            data.days_remaining,
            data.hours_per_day,
            data.subjects
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
        release_quota(
            db=db,
            user_id=current_user.id,
            feature="planner",
            units=1
        )
        print("Study plan generation error:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate study plan."
        )


# ============================================================
# SAVE STUDY PLAN
# ============================================================

@app.post("/save-plan")
def save_plan(
    data: SavePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        old_plans = (
            db.query(StudyPlan)
            .filter(StudyPlan.user_id == current_user.id)
            .all()
        )

        for old_plan in old_plans:
            db.query(StudyTask).filter(
                StudyTask.plan_id == old_plan.id
            ).delete(synchronize_session=False)

            db.delete(old_plan)

        db.commit()

        new_plan = StudyPlan(
            user_id=current_user.id,
            exam=data.exam,
            today=data.today,
            exam_date=data.exam_date,
            days_remaining=data.days_remaining,
            hours_per_day=data.hours_per_day,
            mode=data.mode,
            plan_data=json.dumps(data.plan_data)
        )

        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)

        daily_plan = data.plan_data.get("daily_plan", [])

        for day_data in daily_plan:
            day_number = day_data.get("day", 0)
            day_date = day_data.get("date", "")
            day_tasks = day_data.get("tasks", [])

            if not isinstance(day_tasks, list):
                continue

            for task in day_tasks:
                try:
                    task_hours = float(task.get("hours", 0))
                except (TypeError, ValueError):
                    task_hours = 0

                new_task = StudyTask(
                    plan_id=new_plan.id,
                    user_id=current_user.id,
                    day=day_number,
                    date=day_date,
                    subject=task.get("subject", ""),
                    topic=task.get("topic", ""),
                    activity=task.get("activity", ""),
                    hours=task_hours,
                    completed=0
                )

                db.add(new_task)

        db.commit()

        return {
            "message": "Study plan saved successfully",
            "plan_id": new_plan.id
        }

    except Exception as error:
        db.rollback()
        print("Save plan error:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to save study plan."
        )


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
            "plan": None
        }

    tasks = (
        db.query(StudyTask)
        .filter(
            StudyTask.user_id == current_user.id,
            StudyTask.plan_id == plan.id
        )
        .order_by(StudyTask.day, StudyTask.id)
        .all()
    )

    try:
        saved_plan = json.loads(plan.plan_data)
    except (TypeError, json.JSONDecodeError):
        saved_plan = {}

    daily_plan = {}

    for task in tasks:
        if task.day not in daily_plan:
            daily_plan[task.day] = {
                "day": task.day,
                "date": task.date,
                "tasks": []
            }

        daily_plan[task.day]["tasks"].append({
            "id": task.id,
            "subject": task.subject,
            "topic": task.topic,
            "activity": task.activity,
            "hours": task.hours,
            "completed": bool(task.completed)
        })

    saved_plan["daily_plan"] = list(daily_plan.values())

    return {
        "plan_id": plan.id,
        "exam": plan.exam,
        "today": plan.today,
        "exam_date": plan.exam_date,
        "days_remaining": plan.days_remaining,
        "hours_per_day": plan.hours_per_day,
        "mode": plan.mode,
        "plan": saved_plan
    }


# ============================================================
# ADD MANUAL STUDY TASK
# ============================================================

@app.post("/study-task")
def add_manual_task(
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
            detail="No study plan found."
        )

    new_task = StudyTask(
        plan_id=plan.id,
        user_id=current_user.id,
        day=0,
        date=data.date,
        subject=data.subject,
        topic=data.text,
        activity="Manual task",
        hours=data.hours,
        completed=0
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return {
        "message": "Task added successfully",
        "task": {
            "id": new_task.id,
            "subject": new_task.subject,
            "topic": new_task.topic,
            "activity": new_task.activity,
            "date": new_task.date,
            "hours": new_task.hours,
            "completed": False
        }
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

    reserve_quota(
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
        release_quota(
            db=db,
            user_id=current_user.id,
            feature="notes",
            units=1
        )

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

    otp_code = f"{secrets.randbelow(1_000_000):06d}"
    otp_expiry = datetime.utcnow() + timedelta(
        minutes=OTP_EXPIRY_MINUTES
    )

    try:
        new_user = User(
            name=user.name,
            email=user.email,
            password=hash_password(user.password),
            is_verified=False,
            otp_code=otp_code,
            otp_expires_at=otp_expiry,
            otp_attempts=0,
            otp_resend_count=0,
            otp_last_sent_at=datetime.utcnow(),
            otp_window_started_at=datetime.utcnow(),
        )

        db.add(new_user)
        db.flush()

        subscription = Subscription(
            user_id=new_user.id,
            plan="free",
            status="active"
        )

        db.add(subscription)
        db.commit()
        db.refresh(new_user)

    except Exception as error:
        db.rollback()
        print("Registration error:", error)
        raise HTTPException(
            status_code=500,
            detail="Registration failed. Please try again."
        )

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

    if user.otp_attempts >= OTP_MAX_VERIFY_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Too many incorrect attempts. Please request a new verification code."
        )

    if not user.otp_code or user.otp_code != data.otp:
        user.otp_attempts += 1
        db.commit()

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
    user.otp_attempts = 0
    user.otp_resend_count = 0
    user.otp_last_sent_at = None
    user.otp_window_started_at = None

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

    now = datetime.utcnow()

    if user.otp_last_sent_at:
        elapsed = (now - user.otp_last_sent_at).total_seconds()

        if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)

            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting another code."
            )

    if (
        not user.otp_window_started_at
        or (now - user.otp_window_started_at).total_seconds() >= 3600
    ):
        user.otp_window_started_at = now
        user.otp_resend_count = 0

    if user.otp_resend_count >= OTP_MAX_RESENDS_PER_HOUR:
        raise HTTPException(
            status_code=429,
            detail="Too many verification codes requested. Please try again later."
        )

    otp_code = f"{secrets.randbelow(1_000_000):06d}"

    user.otp_code = otp_code
    user.otp_expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)
    user.otp_attempts = 0
    user.otp_last_sent_at = now
    user.otp_resend_count += 1

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

    if is_legacy_password_hash(db_user.password):
        db_user.password = hash_password(user.password)
        db.commit()

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


# ============================================================
# RAZORPAY PRO SUBSCRIPTION
# ============================================================

@app.post("/payments/create-pro-subscription")
def create_pro_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not RAZORPAY_KEY_ID or not RAZORPAY_PLAN_ID:
        raise HTTPException(
            status_code=503,
            detail="Razorpay is not configured yet."
        )

    current_plan = get_user_plan(db, current_user.id)

    if current_plan == "pro":
        raise HTTPException(
            status_code=400,
            detail="You already have an active Pro subscription."
        )

    existing = (
        db.query(RazorpaySubscription)
        .filter(
            RazorpaySubscription.user_id == current_user.id,
            RazorpaySubscription.status.in_(["created", "authenticated", "active"]),
        )
        .order_by(RazorpaySubscription.id.desc())
        .first()
    )

    if existing and existing.status in ["created", "authenticated"]:
        return {
            "key_id": RAZORPAY_KEY_ID,
            "subscription_id": existing.razorpay_subscription_id,
            "status": existing.status,
        }

    try:
        razorpay_data = create_razorpay_subscription(
            user_id=current_user.id,
            email=current_user.email,
            name=current_user.name,
        )

        subscription_id = razorpay_data.get("id")

        if not subscription_id:
            raise RuntimeError("Razorpay did not return a subscription ID.")

        record = RazorpaySubscription(
            user_id=current_user.id,
            razorpay_subscription_id=subscription_id,
            razorpay_plan_id=razorpay_data.get("plan_id", RAZORPAY_PLAN_ID),
            status=razorpay_data.get("status", "created"),
            current_end=unix_to_datetime(razorpay_data.get("current_end")),
        )

        db.add(record)
        db.commit()

        return {
            "key_id": RAZORPAY_KEY_ID,
            "subscription_id": subscription_id,
            "status": record.status,
        }

    except HTTPException:
        raise
    except Exception as error:
        db.rollback()
        print("Razorpay subscription creation error:", error)
        raise HTTPException(
            status_code=502,
            detail="Unable to create Pro subscription. Please try again."
        )


class VerifyProPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str


@app.post("/payments/verify-pro-payment")
def verify_pro_payment(
    data: VerifyProPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = (
        db.query(RazorpaySubscription)
        .filter(
            RazorpaySubscription.razorpay_subscription_id == data.razorpay_subscription_id,
            RazorpaySubscription.user_id == current_user.id,
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Subscription record not found."
        )

    if not verify_checkout_signature(
        payment_id=data.razorpay_payment_id,
        subscription_id=data.razorpay_subscription_id,
        signature=data.razorpay_signature,
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid payment signature."
        )

    try:
        razorpay_data = fetch_razorpay_subscription(
            data.razorpay_subscription_id
        )
    except Exception as error:
        print("Razorpay verification fetch error:", error)
        raise HTTPException(
            status_code=502,
            detail="Payment was verified, but subscription status could not be confirmed yet."
        )

    status = razorpay_data.get("status", "authenticated")
    current_end = unix_to_datetime(razorpay_data.get("current_end"))

    record.razorpay_payment_id = data.razorpay_payment_id
    record.status = status
    record.current_end = current_end

    if status in ["authenticated", "active"]:
        # Keep access active through the current Razorpay billing period.
        # If current_end is not returned yet, use a short provisional period;
        # the webhook will replace it with Razorpay's authoritative current_end.
        expires_at = current_end or (datetime.now(timezone.utc) + timedelta(days=31))

        subscription = (
            db.query(Subscription)
            .filter(Subscription.user_id == current_user.id)
            .first()
        )

        if not subscription:
            subscription = Subscription(
                user_id=current_user.id,
                plan="free",
                status="active",
            )
            db.add(subscription)

        subscription.plan = "pro"
        subscription.status = "active"
        subscription.started_at = datetime.now(timezone.utc)
        subscription.expires_at = expires_at

    db.commit()

    return {
        "message": "Pro subscription activated successfully.",
        "plan": "pro" if status in ["authenticated", "active"] else "free",
        "status": status,
        "expires_at": current_end,
    }


@app.post("/payments/cancel-pro-subscription")
def cancel_pro_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = (
        db.query(RazorpaySubscription)
        .filter(
            RazorpaySubscription.user_id == current_user.id,
            RazorpaySubscription.status.in_(["authenticated", "active"]),
        )
        .order_by(RazorpaySubscription.id.desc())
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="No active Razorpay subscription found."
        )

    try:
        razorpay_data = cancel_razorpay_subscription(
            record.razorpay_subscription_id,
            at_cycle_end=True,
        )

        record.status = razorpay_data.get("status", record.status)
        record.current_end = unix_to_datetime(razorpay_data.get("current_end")) or record.current_end

        local_subscription = (
            db.query(Subscription)
            .filter(Subscription.user_id == current_user.id)
            .first()
        )

        # Keep Pro active until the already-paid billing cycle ends.
        if local_subscription and record.current_end:
            local_subscription.plan = "pro"
            local_subscription.status = "active"
            local_subscription.expires_at = record.current_end

        db.commit()

        return {
            "message": "Pro cancellation scheduled for the end of the current billing cycle.",
            "expires_at": record.current_end,
        }

    except Exception as error:
        db.rollback()
        print("Razorpay cancellation error:", error)
        raise HTTPException(
            status_code=502,
            detail="Unable to cancel the Pro subscription right now."
        )


# ============================================================
# RAZORPAY WEBHOOK
# ============================================================

@app.post("/payments/razorpay-webhook")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")

    if not signature:
        raise HTTPException(
            status_code=400,
            detail="Missing webhook signature."
        )

    try:
        valid = verify_webhook_signature(raw_body, signature)
    except RuntimeError as error:
        print("Webhook configuration error:", error)
        raise HTTPException(
            status_code=503,
            detail="Webhook is not configured."
        )

    if not valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook signature."
        )

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook payload."
        )

    event = payload.get("event", "")
    subscription_entity = (
        payload.get("payload", {})
        .get("subscription", {})
        .get("entity", {})
    )

    subscription_id = subscription_entity.get("id")

    if not subscription_id:
        return {"received": True}

    record = (
        db.query(RazorpaySubscription)
        .filter(RazorpaySubscription.razorpay_subscription_id == subscription_id)
        .first()
    )

    if not record:
        # Unknown subscriptions are acknowledged after signature validation.
        return {"received": True}

    status = subscription_entity.get("status", record.status)
    current_end = unix_to_datetime(subscription_entity.get("current_end"))

    payment_entity = (
        payload.get("payload", {})
        .get("payment", {})
        .get("entity", {})
    )

    if payment_entity.get("id"):
        record.razorpay_payment_id = payment_entity["id"]

    record.status = status
    if current_end:
        record.current_end = current_end

    local_subscription = (
        db.query(Subscription)
        .filter(Subscription.user_id == record.user_id)
        .first()
    )

    if not local_subscription:
        local_subscription = Subscription(
            user_id=record.user_id,
            plan="free",
            status="active",
        )
        db.add(local_subscription)

    # Successful authentication/charge/activation keeps Pro enabled.
    if event in [
        "subscription.authenticated",
        "subscription.activated",
        "subscription.charged",
        "subscription.resumed",
    ] or status == "active":
        local_subscription.plan = "pro"
        local_subscription.status = "active"
        local_subscription.expires_at = record.current_end or local_subscription.expires_at

    # For failed/cancelled subscriptions, do not revoke already-paid access
    # immediately. The normal quota service will fall back to Free after
    # expires_at has passed.
    elif event in [
        "subscription.pending",
        "subscription.halted",
        "subscription.cancelled",
        "subscription.completed",
        "subscription.paused",
    ]:
        if record.current_end:
            local_subscription.plan = "pro"
            local_subscription.status = "active"
            local_subscription.expires_at = record.current_end
        elif event in ["subscription.completed", "subscription.cancelled"]:
            local_subscription.plan = "free"
            local_subscription.status = "active"
            local_subscription.expires_at = None

    db.commit()

    return {"received": True}
