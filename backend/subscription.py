from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Float,
    Index,
)

from database import Base


# ============================================================
# SUBSCRIPTION
# ============================================================

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False, unique=True, index=True)

    # free / pro
    plan = Column(
        String(20),
        nullable=False,
        default="free"
    )

    # active / cancelled / expired
    status = Column(
        String(20),
        nullable=False,
        default="active"
    )

    started_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    expires_at = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )


# ============================================================
# AI USAGE
# ============================================================

class AIUsage(Base):
    __tablename__ = "ai_usage"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    # mcq / notes / planner
    feature = Column(
        String(30),
        nullable=False,
        index=True
    )

    # Number of MCQs generated.
    # For notes/planner this will normally be 1.
    units = Column(
        Integer,
        nullable=False,
        default=1
    )

    model = Column(
        String(100),
        nullable=False,
        default="gemini-2.5-flash"
    )

    input_tokens = Column(
        Integer,
        nullable=False,
        default=0
    )

    output_tokens = Column(
        Integer,
        nullable=False,
        default=0
    )

    total_tokens = Column(
        Integer,
        nullable=False,
        default=0
    )

    estimated_cost_usd = Column(
        Float,
        nullable=False,
        default=0.0
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True
    )


Index(
    "ix_ai_usage_user_feature_created",
    AIUsage.user_id,
    AIUsage.feature,
    AIUsage.created_at
)
