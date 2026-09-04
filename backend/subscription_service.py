from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

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
    },
}


# ============================================================
# GEMINI PRICING
# ============================================================

# Gemini 2.5 Flash
# Input:  $0.30 / 1M tokens
# Output: $2.50 / 1M tokens

GEMINI_INPUT_PRICE = 0.30
GEMINI_OUTPUT_PRICE = 2.50


# ============================================================
# CURRENT TIME
# ============================================================

def utc_now():
    return datetime.now(timezone.utc)


# ============================================================
# DATE HELPERS
# ============================================================

def start_of_day():
    now = utc_now()

    return now.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )


def start_of_month():
    now = utc_now()

    return now.replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )


# ============================================================
# GET / CREATE SUBSCRIPTION
# ============================================================

def get_subscription(
    db: Session,
    user_id: int,
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
        status="active",
        started_at=utc_now(),
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
    user_id: int,
):
    subscription = get_subscription(
        db,
        user_id,
    )

    # --------------------------------------------------------
    # Subscription not active
    # --------------------------------------------------------

    if subscription.status != "active":
        return "free"

    # --------------------------------------------------------
    # Invalid plan
    # --------------------------------------------------------

    if subscription.plan not in PLANS:
        return "free"

    # --------------------------------------------------------
    # Pro expired
    # --------------------------------------------------------

    if (
        subscription.plan == "pro"
        and subscription.expires_at is not None
        and subscription.expires_at < utc_now()
    ):
        subscription.plan = "free"
        subscription.status = "active"
        subscription.expires_at = None

        db.commit()

        return "free"

    return subscription.plan


# ============================================================
# DAILY USAGE
# ============================================================

def get_daily_usage(
    db: Session,
    user_id: int,
    feature: str,
):
    start = start_of_day()

    used = (
        db.query(
            func.coalesce(
                func.sum(AIUsage.units),
                0,
            )
        )
        .filter(
            AIUsage.user_id == user_id,
            AIUsage.feature == feature,
            AIUsage.created_at >= start,
        )
        .scalar()
    )

    return int(used or 0)


# ============================================================
# MONTHLY USAGE
# ============================================================

def get_monthly_usage(
    db: Session,
    user_id: int,
    feature: str,
):
    start = start_of_month()

    used = (
        db.query(
            func.coalesce(
                func.sum(AIUsage.units),
                0,
            )
        )
        .filter(
            AIUsage.user_id == user_id,
            AIUsage.feature == feature,
            AIUsage.created_at >= start,
        )
        .scalar()
    )

    return int(used or 0)


# ============================================================
# GET LIMIT
# ============================================================

def get_feature_limit(
    db: Session,
    user_id: int,
    feature: str,
):
    plan = get_user_plan(
        db,
        user_id,
    )

    limits = PLANS[plan]

    if feature == "mcq":
        return limits["mcq_daily"]

    if feature == "notes":
        return limits["notes_daily"]

    if feature == "planner":
        return limits["planner_monthly"]

    raise HTTPException(
        status_code=400,
        detail="Unknown AI feature.",
    )


# ============================================================
# CHECK QUOTA
# ============================================================

def check_quota(
    db: Session,
    user_id: int,
    feature: str,
    units: int = 1,
):
    if units <= 0:
        raise HTTPException(
            status_code=400,
            detail="Units must be greater than zero.",
        )

    plan = get_user_plan(
        db,
        user_id,
    )

    limits = PLANS[plan]

    # --------------------------------------------------------
    # MCQ
    # --------------------------------------------------------

    if feature == "mcq":

        limit = limits["mcq_daily"]

        used = get_daily_usage(
            db,
            user_id,
            "mcq",
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
                    "requested": units,
                    "remaining": max(
                        0,
                        limit - used,
                    ),
                },
            )

        return {
            "plan": plan,
            "limit": limit,
            "used": used,
            "requested": units,
            "remaining": limit - used,
            "period": "daily",
        }

    # --------------------------------------------------------
    # NOTES
    # --------------------------------------------------------

    if feature == "notes":

        limit = limits["notes_daily"]

        used = get_daily_usage(
            db,
            user_id,
            "notes",
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
                    "requested": units,
                    "remaining": max(
                        0,
                        limit - used,
                    ),
                },
            )

        return {
            "plan": plan,
            "limit": limit,
            "used": used,
            "requested": units,
            "remaining": limit - used,
            "period": "daily",
        }

    # --------------------------------------------------------
    # PLANNER
    # --------------------------------------------------------

    if feature == "planner":

        limit = limits["planner_monthly"]

        used = get_monthly_usage(
            db,
            user_id,
            "planner",
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
                    "requested": units,
                    "remaining": max(
                        0,
                        limit - used,
                    ),
                },
            )

        return {
            "plan": plan,
            "limit": limit,
            "used": used,
            "requested": units,
            "remaining": limit - used,
            "period": "monthly",
        }

    raise HTTPException(
        status_code=400,
        detail="Unknown AI feature.",
    )


# ============================================================
# RESERVE QUOTA
# ============================================================
#
# IMPORTANT:
#
# With the current AIUsage-only database design, this function
# performs a quota check BEFORE Gemini is called.
#
# The actual AIUsage row is created only after Gemini succeeds.
#
# This protects against normal quota overuse, but it is NOT a
# perfect database-level atomic reservation system under heavy
# concurrent traffic.
#
# For your current SQLite architecture, this is the safest
# drop-in version without changing subscription.py.
# ============================================================

def reserve_quota(
    db: Session,
    user_id: int,
    feature: str,
    units: int = 1,
):
    return check_quota(
        db=db,
        user_id=user_id,
        feature=feature,
        units=units,
    )


# ============================================================
# RELEASE QUOTA
# ============================================================
#
# Since quota is based on successfully recorded AIUsage rows,
# there is normally nothing to release if Gemini fails BEFORE
# record_ai_usage().
#
# This function exists so main.py can use a clean try/except
# pattern.
# ============================================================

def release_quota(
    db: Session,
    user_id: int,
    feature: str,
    units: int = 1,
):
    # No AIUsage row was created during reservation.
    #
    # Therefore there is nothing to subtract.
    #
    # Kept as a function for API compatibility and future
    # migration to a real atomic quota table.

    return True


# ============================================================
# RECORD AI USAGE
# ============================================================

def record_ai_usage(
    db: Session,
    user_id: int,
    feature: str,
    units: int,
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
):
    # --------------------------------------------------------
    # Validate values
    # --------------------------------------------------------

    if units <= 0:
        raise HTTPException(
            status_code=400,
            detail="Usage units must be greater than zero.",
        )

    input_tokens = max(
        0,
        int(input_tokens or 0),
    )

    output_tokens = max(
        0,
        int(output_tokens or 0),
    )

    # --------------------------------------------------------
    # Total tokens
    # --------------------------------------------------------

    total_tokens = (
        input_tokens +
        output_tokens
    )

    # --------------------------------------------------------
    # Estimated Gemini cost
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Create usage record
    # --------------------------------------------------------

    usage = AIUsage(
        user_id=user_id,
        feature=feature,
        units=units,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
        estimated_cost_usd=estimated_cost,
        created_at=utc_now(),
    )

    db.add(usage)
    db.commit()
    db.refresh(usage)

    return usage


# ============================================================
# TOTAL AI COST
# ============================================================

def get_total_ai_cost(
    db: Session,
    user_id: int,
):
    total = (
        db.query(
            func.coalesce(
                func.sum(
                    AIUsage.estimated_cost_usd
                ),
                0.0,
            )
        )
        .filter(
            AIUsage.user_id == user_id
        )
        .scalar()
    )

    return float(total or 0.0)


# ============================================================
# TOTAL AI TOKENS
# ============================================================

def get_total_ai_tokens(
    db: Session,
    user_id: int,
):
    total = (
        db.query(
            func.coalesce(
                func.sum(
                    AIUsage.total_tokens
                ),
                0,
            )
        )
        .filter(
            AIUsage.user_id == user_id
        )
        .scalar()
    )

    return int(total or 0)


# ============================================================
# USAGE SUMMARY
# ============================================================

def get_usage_summary(
    db: Session,
    user_id: int,
):
    plan = get_user_plan(
        db,
        user_id,
    )

    limits = PLANS[plan]

    # --------------------------------------------------------
    # Current usage
    # --------------------------------------------------------

    mcq_used = get_daily_usage(
        db,
        user_id,
        "mcq",
    )

    notes_used = get_daily_usage(
        db,
        user_id,
        "notes",
    )

    planner_used = get_monthly_usage(
        db,
        user_id,
        "planner",
    )

    # --------------------------------------------------------
    # Cost / token information
    # --------------------------------------------------------

    total_cost = get_total_ai_cost(
        db,
        user_id,
    )

    total_tokens = get_total_ai_tokens(
        db,
        user_id,
    )

    # --------------------------------------------------------
    # Return
    # --------------------------------------------------------

    return {
        "plan": plan,

        "mcq": {
            "used": mcq_used,
            "limit": limits["mcq_daily"],
            "remaining": max(
                0,
                limits["mcq_daily"] - mcq_used,
            ),
            "period": "daily",
        },

        "notes": {
            "used": notes_used,
            "limit": limits["notes_daily"],
            "remaining": max(
                0,
                limits["notes_daily"] - notes_used,
            ),
            "period": "daily",
        },

        "planner": {
            "used": planner_used,
            "limit": limits["planner_monthly"],
            "remaining": max(
                0,
                limits["planner_monthly"] - planner_used,
            ),
            "period": "monthly",
        },

        "ai_usage": {
            "total_tokens": total_tokens,
            "estimated_cost_usd": round(
                total_cost,
                6,
            ),
        },
    }


# ============================================================
# CHANGE SUBSCRIPTION
# ============================================================

def activate_pro_subscription(
    db: Session,
    user_id: int,
    expires_at: datetime,
):
    subscription = get_subscription(
        db,
        user_id,
    )

    subscription.plan = "pro"
    subscription.status = "active"
    subscription.started_at = utc_now()
    subscription.expires_at = expires_at

    db.commit()
    db.refresh(subscription)

    return subscription


# ============================================================
# CANCEL SUBSCRIPTION
# ============================================================

def cancel_subscription(
    db: Session,
    user_id: int,
):
    subscription = get_subscription(
        db,
        user_id,
    )

    subscription.status = "cancelled"

    db.commit()
    db.refresh(subscription)

    return subscription


# ============================================================
# DOWNGRADE TO FREE
# ============================================================

def downgrade_to_free(
    db: Session,
    user_id: int,
):
    subscription = get_subscription(
        db,
        user_id,
    )

    subscription.plan = "free"
    subscription.status = "active"
    subscription.expires_at = None

    db.commit()
    db.refresh(subscription)

    return subscription
