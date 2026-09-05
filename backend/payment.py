import hashlib
import hmac
import os

import requests
from sqlalchemy import Column, DateTime, Integer, String, Index
from datetime import datetime, timezone

from database import Base


RAZORPAY_API_BASE = "https://api.razorpay.com/v1"
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_PLAN_ID = os.getenv("RAZORPAY_PLAN_ID")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")


class RazorpaySubscription(Base):
    __tablename__ = "razorpay_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    razorpay_subscription_id = Column(String(100), nullable=False, unique=True, index=True)
    razorpay_plan_id = Column(String(100), nullable=False)
    razorpay_payment_id = Column(String(100), nullable=True, index=True)
    status = Column(String(30), nullable=False, default="created")
    current_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


Index(
    "ix_razorpay_subscription_user_status",
    RazorpaySubscription.user_id,
    RazorpaySubscription.status,
)


def require_razorpay_config():
    missing = []

    if not RAZORPAY_KEY_ID:
        missing.append("RAZORPAY_KEY_ID")
    if not RAZORPAY_KEY_SECRET:
        missing.append("RAZORPAY_KEY_SECRET")
    if not RAZORPAY_PLAN_ID:
        missing.append("RAZORPAY_PLAN_ID")

    if missing:
        raise RuntimeError(
            "Missing Razorpay environment variables: " + ", ".join(missing)
        )


def razorpay_request(method: str, path: str, **kwargs):
    require_razorpay_config()

    response = requests.request(
        method=method,
        url=f"{RAZORPAY_API_BASE}{path}",
        auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
        timeout=15,
        **kwargs,
    )

    if not response.ok:
        try:
            detail = response.json()
        except ValueError:
            detail = response.text

        raise RuntimeError(f"Razorpay API error ({response.status_code}): {detail}")

    return response.json()


def create_razorpay_subscription(user_id: int, email: str, name: str):
    payload = {
        "plan_id": RAZORPAY_PLAN_ID,
        "total_count": 12,
        "quantity": 1,
        "customer_notify": True,
        "notes": {
            "user_id": str(user_id),
            "email": email,
            "product": "ExamAce Pro",
        },
    }

    return razorpay_request(
        "POST",
        "/subscriptions",
        json=payload,
    )


def fetch_razorpay_subscription(subscription_id: str):
    return razorpay_request(
        "GET",
        f"/subscriptions/{subscription_id}",
    )


def cancel_razorpay_subscription(subscription_id: str, at_cycle_end: bool = True):
    return razorpay_request(
        "POST",
        f"/subscriptions/{subscription_id}/cancel",
        json={"cancel_at_cycle_end": at_cycle_end},
    )


def verify_checkout_signature(
    payment_id: str,
    subscription_id: str,
    signature: str,
):
    require_razorpay_config()

    generated = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        f"{payment_id}|{subscription_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(generated, signature)


def verify_webhook_signature(raw_body: bytes, signature: str):
    if not RAZORPAY_WEBHOOK_SECRET:
        raise RuntimeError("RAZORPAY_WEBHOOK_SECRET is not configured.")

    generated = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(generated, signature)


def unix_to_datetime(timestamp):
    if not timestamp:
        return None

    try:
        return datetime.fromtimestamp(int(timestamp), tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None
