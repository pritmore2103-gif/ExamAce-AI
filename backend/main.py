from datetime import datetime, timedelta
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

from database import (
    engine,
    SessionLocal
)

from models import (
    Base,
    User,
    Note,
    StudyPlan,
    StudyTask,
)

# NEW
from subscription import (
    Subscription,
    AIUsage
)

from subscription_service import (
    check_quota,
    get_user_plan,
    get_usage_summary,
    record_ai_usage
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

from ai_notes import (
    generate_notes
)

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

from email_utils import send_otp_email


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


class VerifyOTPRequest(BaseModel):

    email: str

    otp: str


class ResendOTPRequest(BaseModel):

    email: str


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
    data: MCQRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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

    # ========================================================
    # CHECK QUOTA BEFORE GEMINI
    # ========================================================

    check_quota(
        db=db,
        user_id=current_user.id,
        feature="mcq",
        units=data.count
    )

    try:

        result = generate_mcqs(
            topic=data.topic.strip(),
            difficulty=data.difficulty,
            count=data.count,
            subject=data.subject,
            exam=data.exam
        )

        # Supports the updated ai.py:
        # (content, input_tokens, output_tokens)
        if isinstance(result, tuple):

            result_data = result[0]

            input_tokens = (
                result[1]
                if len(result) > 1
                else 0
            )

            output_tokens = (
                result[2]
                if len(result) > 2
                else 0
            )

        else:

            result_data = result
            input_tokens = 0
            output_tokens = 0

        # ====================================================
        # RECORD GEMINI USAGE
        # ====================================================

        record_ai_usage(
            db=db,
            user_id=current_user.id,
            feature="mcq",
            units=data.count,
            model="gemini-2.5-flash",
            input_tokens=input_tokens or 0,
            output_tokens=output_tokens or 0
        )

        return result_data

    except HTTPException:
        raise

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

    # ========================================================
    # CHECK MONTHLY PLANNER QUOTA BEFORE GEMINI
    # ========================================================

    check_quota(
        db=db,
        user_id=current_user.id,
        feature="planner",
        units=1
    )

    try:

        plan = generate_study_plan(
            data.exam,
            data.today,
            data.exam_date,
            data.days_remaining,
            data.hours_per_day,
            data.subjects,
        )

        # Supports the updated ai.py:
        # (content, input_tokens, output_tokens)
        if isinstance(plan, tuple):

            plan_content = plan[0]

            input_tokens = (
                plan[1]
                if len(plan) > 1
                else 0
            )

            output_tokens = (
                plan[2]
                if len(plan) > 2
                else 0
            )

        else:

            plan_content = plan
            input_tokens = 0
            output_tokens = 0

        # ====================================================
        # RECORD GEMINI USAGE
        # ====================================================

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
            "content": plan_content
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "Study plan generation error:",
            error
        )

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

    daily_plan = data.plan_data.get(
        "daily_plan",
        []
    )


    # --------------------------------------------------------
    # Create individual tasks
    # --------------------------------------------------------

    for day_data in daily_plan:

        day_number = day_data.get(
            "day"
        )

        day_date = day_data.get(
            "date"
        )

        day_tasks = day_data.get(
            "tasks",
            []
        )

        for task in day_tasks:

            try:

                task_hours = float(
                    task.get(
                        "hours",
                        0
                    )
                )

            except (
                TypeError,
                ValueError
            ):

                task_hours = 0


            new_task = StudyTask(

                plan_id=new_plan.id,

                user_id=current_user.id,

                day=day_number,

                date=day_date,

                subject=task.get(
                    "subject",
                    ""
                ),

                topic=task.get(
                    "topic",
                    ""
                ),

                activity=task.get(
                    "activity",
                    ""
                ),

                hours=task_hours,

                completed=0,

            )

            db.add(new_task)

    db.commit()


    return {

        "message":
            "Study plan saved successfully",

        "plan_id":
            new_plan.id

    }


# ============================================================
# GET SAVED PLAN
# ============================================================

@app.get("/my-plan")
def get_my_plan(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    plan = (

        db.query(StudyPlan)

        .filter(

            StudyPlan.user_id ==
            current_user.id

        )

        .order_by(

            StudyPlan.id.desc()

        )

        .first()

    )


    if not plan:

        return {

            "plan": None

        }


    # --------------------------------------------------------
    # Get tasks
    # --------------------------------------------------------

    tasks = (

        db.query(StudyTask)

        .filter(

            StudyTask.plan_id ==
            plan.id

        )

        .order_by(

            StudyTask.day,

            StudyTask.id

        )

        .all()

    )


    # --------------------------------------------------------
    # Convert tasks into daily structure
    # --------------------------------------------------------

    daily_plan = {}


    for task in tasks:

        if task.day not in daily_plan:

            daily_plan[task.day] = {

                "day":
                    task.day,

                "date":
                    task.date,

                "tasks":
                    []

            }


        daily_plan[
            task.day
        ][
            "tasks"
        ].append({

            "id":
                task.id,

            "subject":
                task.subject,

            "topic":
                task.topic,

            "activity":
                task.activity,

            "hours":
                task.hours,

            "completed":
                bool(
                    task.completed
                )

        })


    # --------------------------------------------------------
    # Load original plan data
    # --------------------------------------------------------

    try:

        saved_plan = json.loads(
            plan.plan_data
        )

    except (
        TypeError,
        json.JSONDecodeError
    ):

        saved_plan = {}


    saved_plan[
        "daily_plan"
    ] = list(
        daily_plan.values()
    )


    return {

        "plan_id":
            plan.id,

        "exam":
            plan.exam,

        "today":
            plan.today,

        "exam_date":
            plan.exam_date,

        "days_remaining":
            plan.days_remaining,

        "hours_per_day":
            plan.hours_per_day,

        "mode":
            plan.mode,

        "plan":
            saved_plan

    }


# ============================================================
# ADD MANUAL TASK
# ============================================================

@app.post("/study-task")
def add_manual_task(

    data: ManualTaskRequest,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    plan = (

        db.query(StudyPlan)

        .filter(

            StudyPlan.user_id ==
            current_user.id

        )

        .order_by(
            StudyPlan.id.desc()
        )

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

        "message":
            "Task added successfully",

        "task": {

            "id":
                new_task.id,

            "subject":
                new_task.subject,

            "topic":
                new_task.topic,

            "activity":
                new_task.activity,

            "date":
                new_task.date,

            "hours":
                new_task.hours,

            "completed":
                False

        }

    }


# ============================================================
# COMPLETE / UNCOMPLETE STUDY TASK
# ============================================================

@app.patch(
    "/study-task/{task_id}"
)
def update_study_task(

    task_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    task = (

        db.query(StudyTask)

        .filter(

            StudyTask.id ==
            task_id,

            StudyTask.user_id ==
            current_user.id

        )

        .first()

    )


    if not task:

        raise HTTPException(

            status_code=404,

            detail="Task not found"

        )


    task.completed = (

        0

        if task.completed

        else 1

    )


    db.commit()

    db.refresh(task)


    return {

        "message":
            "Task updated",

        "task_id":
            task.id,

        "completed":
            bool(
                task.completed
            )

    }


# ============================================================
# DELETE STUDY TASK
# ============================================================

@app.delete(
    "/study-task/{task_id}"
)
def delete_study_task(

    task_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    task = (

        db.query(StudyTask)

        .filter(

            StudyTask.id ==
            task_id,

            StudyTask.user_id ==
            current_user.id

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

        "message":
            "Task deleted successfully"

    }


# ============================================================
# STUDY PLAN PROGRESS
# ============================================================

@app.get("/study-progress")
def study_progress(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    tasks = (

        db.query(StudyTask)

        .filter(

            StudyTask.user_id ==
            current_user.id

        )

        .all()

    )


    total_tasks = len(tasks)

    completed_tasks = sum(

        1

        for task in tasks

        if task.completed

    )


    total_hours = sum(

        task.hours or 0

        for task in tasks

    )


    completed_hours = sum(

        task.hours or 0

        for task in tasks

        if task.completed

    )


    progress = (

        round(
            completed_tasks /
            total_tasks *
            100
        )

        if total_tasks

        else 0

    )


    hour_progress = (

        round(
            completed_hours /
            total_hours *
            100
        )

        if total_hours

        else 0

    )


    return {

        "total_tasks":
            total_tasks,

        "completed_tasks":
            completed_tasks,

        "remaining_tasks":
            total_tasks -
            completed_tasks,

        "total_hours":
            total_hours,

        "completed_hours":
            completed_hours,

        "remaining_hours":
            total_hours -
            completed_hours,

        "task_progress":
            progress,

        "hour_progress":
            hour_progress

    }


# ============================================================
# DELETE ENTIRE STUDY PLAN
# ============================================================

@app.delete("/my-plan")
def delete_my_plan(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    plans = (

        db.query(StudyPlan)

        .filter(

            StudyPlan.user_id ==
            current_user.id

        )

        .all()

    )


    for plan in plans:

        db.query(StudyTask).filter(

            StudyTask.plan_id ==
            plan.id

        ).delete(

            synchronize_session=False

        )

        db.delete(plan)


    db.commit()


    return {

        "message":
            "Study plan deleted"

    }


# ============================================================
# QUIZ
# ============================================================

@app.post("/generate-quiz")
def generate_quiz(
    data: MCQRequest
):

    questions = []


    for i in range(
        data.count
    ):

        questions.append({

            "question":
                f"{data.topic} Question {i + 1}",

            "options": [

                "Option A",

                "Option B",

                "Option C",

                "Option D"

            ],

            "answer":
                random.choice(
                    [
                        "A",
                        "B",
                        "C",
                        "D"
                    ]
                )

        })


    return {

        "questions":
            questions

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

    # ========================================================
    # CHECK DAILY NOTES QUOTA BEFORE GEMINI
    # ========================================================

    check_quota(
        db=db,
        user_id=current_user.id,
        feature="notes",
        units=1
    )

    try:

        result = generate_notes(
            data.topic.strip()
        )

        # Supports the updated ai_notes.py:
        # (content, input_tokens, output_tokens)
        if isinstance(result, tuple):

            content = result[0]

            input_tokens = (
                result[1]
                if len(result) > 1
                else 0
            )

            output_tokens = (
                result[2]
                if len(result) > 2
                else 0
            )

        else:

            content = result
            input_tokens = 0
            output_tokens = 0

        # ====================================================
        # RECORD GEMINI USAGE
        # ====================================================

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

        print(
            "Notes generation error:",
            error
        )

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
        .filter(
            Subscription.user_id ==
            current_user.id
        )
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

    # Let subscription_service handle expiry.
    plan = get_user_plan(
        db,
        current_user.id
    )

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

    return get_usage_summary(
        db,
        current_user.id
    )


# ============================================================
# REGISTER
# ============================================================

@app.post("/register")
def register(

    user: UserCreate,

    db: Session = Depends(
        get_db
    )

):

    existing_user = (

        db.query(User)

        .filter(

            User.email ==
            user.email

        )

        .first()

    )


    if existing_user:

        return {

            "error":
                "Email already exists"

        }

    otp_code = f"{random.randint(0, 999999):06d}"

    otp_expiry = datetime.utcnow() + timedelta(minutes=10)

    new_user = User(

        name=user.name,

        email=user.email,

        password=hash_password(
            user.password
        ),

        is_verified=False,

        otp_code=otp_code,

        otp_expires_at=otp_expiry,

    )


    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    # ========================================================
    # CREATE FREE SUBSCRIPTION
    # ========================================================

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

        "message":
            "User created. Please check your email for a verification code."
            if email_sent
            else "User created, but the verification email could not be sent. Please contact support.",

        "user_id":
            new_user.id

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

        .filter(

            User.email ==
            data.email

        )

        .first()

    )

    if not user:

        raise HTTPException(

            status_code=404,

            detail="User not found."

        )

    if user.is_verified:

        return {

            "message":
                "Email already verified."

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

        "message":
            "Email verified successfully! You can now log in."

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

        .filter(

            User.email ==
            data.email

        )

        .first()

    )

    if not user:

        raise HTTPException(

            status_code=404,

            detail="User not found."

        )

    if user.is_verified:

        return {

            "message":
                "Email already verified."

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

        "message":
            "A new verification code has been sent."
            if email_sent
            else "Could not send verification code. Please try again."

    }


# ============================================================
# ADMIN: ACTIVATE PRO
# ============================================================
#
# TEMPORARY ADMIN ENDPOINT
#
# IMPORTANT:
# Add real admin authentication before production.
# Do NOT expose this endpoint to normal users.
#
# ============================================================

@app.post("/admin/activate-pro/{user_id}")
def activate_pro(
    user_id: int,
    db: Session = Depends(get_db)
):

    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id ==
            user_id
        )
        .first()
    )

    if not subscription:

        subscription = Subscription(
            user_id=user_id,
            plan="free",
            status="active"
        )

        db.add(subscription)

    subscription.plan = "pro"
    subscription.status = "active"
    subscription.started_at = datetime.utcnow()

    # Temporary 30-day Pro subscription.
    subscription.expires_at = (
        datetime.utcnow()
        + timedelta(days=30)
    )

    db.commit()
    db.refresh(subscription)

    return {
        "message": "Pro activated",
        "user_id": user_id,
        "plan": subscription.plan,
        "expires_at": subscription.expires_at
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
def login(

    user: UserLogin,

    db: Session = Depends(
        get_db
    )

):

    db_user = (

        db.query(User)

        .filter(

            User.email ==
            user.email

        )

        .first()

    )


    if not db_user:

        return {

            "error":
                "Invalid credentials"

        }


    if not verify_password(

        user.password,

        db_user.password

    ):

        return {

            "error":
                "Invalid credentials"

        }

    if not db_user.is_verified:

        return {

            "error":
                "Please verify your email before logging in.",

            "unverified":
                True,

            "email":
                db_user.email

        }


    token = create_access_token({

        "user_id":
            db_user.id

    })


    return {

        "access_token":
            token,

        "user_id":
            db_user.id,

        "name":
            db_user.name

    }
