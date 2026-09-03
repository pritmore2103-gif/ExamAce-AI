from datetime import datetime, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException

from subscription import Subscription, AIUsage


# ============================================================
# PLAN CONFIGURATION
# ============================================================

PLANS = {

    "free": {
        "mcq_daily": 20,
        "notes_daily": 2,
        "planner_monthly": 1,
    },

    "pro": {
        "mcq_daily": 200,
        "notes_daily": 10,
        "planner_monthly": 5,
    }
}


# ============================================================
# GEMINI PRICING
# ============================================================

# Gemini 2.5 Flash standard pricing.
#
# $0.30 / 1M input tokens
# $2.50 / 1M output tokens

GEMINI_INPUT_PRICE = 0.30
GEMINI_OUTPUT_PRICE = 2.50


# ============================================================
# CURRENT TIME
# ============================================================

def utc_now():
    return datetime.now(timezone.utc)


# ============================================================
# GET / CREATE SUBSCRIPTION
# ============================================================

def get_subscription(
    db: Session,
    user_id: int
):

    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user_id
        )
        .first()
    )

    if subscription:
        return subscription

    subscription = Subscription(
        user_id=user_id,
        plan="free",
        status="active"
    )

    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    return subscription


# ============================================================
# ACTIVE PLAN
# ============================================================

def get_user_plan(
    db: Session,
    user_id: int
):

    subscription = get_subscription(
        db,
        user_id
    )

    # Automatically fall back to free
    # if subscription isn't active.

    if subscription.status != "active":
        return "free"

    if subscription.plan not in PLANS:
        return "free"

    # If Pro has expired, downgrade to free.

    if (
        subscription.plan == "pro"
        and
        subscription.expires_at
        and
        subscription.expires_at < utc_now()
    ):

        subscription.plan = "free"
        subscription.status = "active"

        db.commit()

        return "free"

    return subscription.plan


# ============================================================
# DATE HELPERS
# ============================================================

def start_of_day():
    now = utc_now()

    return now.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )


def start_of_month():
    now = utc_now()

    return now.replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )


# ============================================================
# DAILY USAGE
# ============================================================

def get_daily_usage(
    db: Session,
    user_id: int,
    feature: str
):

    start = start_of_day()

    usage = (
        db.query(AIUsage)
        .filter(
            AIUsage.user_id == user_id,
            AIUsage.feature == feature,
            AIUsage.created_at >= start
        )
        .all()
    )

    return sum(
        item.units
        for item in usage
    )


# ============================================================
# MONTHLY USAGE
# ============================================================

def get_monthly_usage(
    db: Session,
    user_id: int,
    feature: str
):

    start = start_of_month()

    usage = (
        db.query(AIUsage)
        .filter(
            AIUsage.user_id == user_id,
            AIUsage.feature == feature,
            AIUsage.created_at >= start
        )
        .all()
    )

    return sum(
        item.units
        for item in usage
    )


# ============================================================
# CHECK QUOTA
# ============================================================

def check_quota(
    db: Session,
    user_id: int,
    feature: str,
    units: int = 1
):

    plan = get_user_plan(
        db,
        user_id
    )

    limits = PLANS[plan]

    # --------------------------------------------------------
    # MCQs
    # --------------------------------------------------------

    if feature == "mcq":

        limit = limits["mcq_daily"]

        used = get_daily_usage(
            db,
            user_id,
            "mcq"
        )

        if used + units > limit:

            raise HTTPException(
                status_code=429,
                detail={
                    "error": "daily_quota_exceeded",
                    "feature": "mcq",
                    "plan": plan,
                    "limit": limit,
                    "used": used,
                    "remaining": max(
                        0,
                        limit - used
                    )
                }
            )

        return {
            "plan": plan,
            "limit": limit,
            "used": used,
            "remaining": limit - used
        }

    # --------------------------------------------------------
    # NOTES
    # --------------------------------------------------------

    if feature == "notes":

        limit = limits["notes_daily"]

        used = get_daily_usage(
            db,
            user_id,
            "notes"
        )

        if used + units > limit:

            raise HTTPException(
                status_code=429,
                detail={
                    "error": "daily_quota_exceeded",
                    "feature": "notes",
                    "plan": plan,
                    "limit": limit,
                    "used": used,
                    "remaining": max(
                        0,
                        limit - used
                    )
                }
            )

        return {
            "plan": plan,
            "limit": limit,
            "used": used,
            "remaining": limit - used
        }

    # --------------------------------------------------------
    # STUDY PLANNER
    # --------------------------------------------------------

    if feature == "planner":

        limit = limits["planner_monthly"]

        used = get_monthly_usage(
            db,
            user_id,
            "planner"
        )

        if used + units > limit:

            raise HTTPException(
                status_code=429,
                detail={
                    "error": "monthly_quota_exceeded",
                    "feature": "planner",
                    "plan": plan,
                    "limit": limit,
                    "used": used,
                    "remaining": max(
                        0,
                        limit - used
                    )
                }
            )

        return {
            "plan": plan,
            "limit": limit,
            "used": used,
            "remaining": limit - used
        }

    raise HTTPException(
        status_code=400,
        detail="Unknown AI feature."
    )


# ============================================================
# RECORD AI USAGE
# ============================================================

def record_ai_usage(
    db: Session,
    user_id: int,
    feature: str,
    units: int,
    model: str,
    input_tokens: int,
    output_tokens: int
):

    total_tokens = (
        input_tokens +
        output_tokens
    )

    input_cost = (
        input_tokens / 1_000_000
    ) * GEMINI_INPUT_PRICE

    output_cost = (
        output_tokens / 1_000_000
    ) * GEMINI_OUTPUT_PRICE

    estimated_cost = (
        input_cost +
        output_cost
    )

    usage = AIUsage(
        user_id=user_id,
        feature=feature,
        units=units,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
        estimated_cost_usd=estimated_cost
    )

    db.add(usage)
    db.commit()

    return usage


# ============================================================
# USAGE SUMMARY
# ============================================================

def get_usage_summary(
    db: Session,
    user_id: int
):

    plan = get_user_plan(
        db,
        user_id
    )

    limits = PLANS[plan]

    mcq_used = get_daily_usage(
        db,
        user_id,
        "mcq"
    )

    notes_used = get_daily_usage(
        db,
        user_id,
        "notes"
    )

    planner_used = get_monthly_usage(
        db,
        user_id,
        "planner"
    )

    return {
        "plan": plan,

        "mcq": {
            "used": mcq_used,
            "limit": limits["mcq_daily"],
            "remaining": max(
                0,
                limits["mcq_daily"] - mcq_used
            ),
            "period": "daily"
        },

        "notes": {
            "used": notes_used,
            "limit": limits["notes_daily"],
            "remaining": max(
                0,
                limits["notes_daily"] - notes_used
            ),
            "period": "daily"
        },

        "planner": {
            "used": planner_used,
            "limit": limits["planner_monthly"],
            "remaining": max(
                0,
                limits["planner_monthly"] - planner_used
            ),
            "period": "monthly"
        }
    }
