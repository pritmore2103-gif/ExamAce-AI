import os
import requests


# ============================================================
# CONFIG
# ============================================================

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL")
FROM_NAME = "ExamAce AI"

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


# ============================================================
# SEND OTP EMAIL
# ============================================================

def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Sends a 6-digit OTP verification code via Brevo's HTTP API.

    Returns True if sent successfully, False otherwise.
    """

    if not BREVO_API_KEY or not FROM_EMAIL:
        print("⚠️ Brevo API key or FROM_EMAIL is not configured.")
        return False

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2 style="color:#2563eb;">Verify your ExamAce AI account 🎓</h2>
        <p>Use the code below to verify your email address. It expires in 10 minutes.</p>
        <div style="text-align:center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                         background:#f1f5f9; padding: 16px 24px; border-radius: 12px; display: inline-block;">
                {otp}
            </span>
        </div>
        <p style="color:#888; font-size:12px;">
            If you didn't create an ExamAce AI account, you can safely ignore this email.
        </p>
    </div>
    """

    payload = {
        "sender": {
            "name": FROM_NAME,
            "email": FROM_EMAIL,
        },
        "to": [
            {"email": to_email}
        ],
        "subject": "Your ExamAce AI verification code",
        "htmlContent": html_body,
    }

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

    try:
        response = requests.post(
            BREVO_API_URL,
            json=payload,
            headers=headers,
            timeout=10,
        )

        if response.status_code in (200, 201):
            print(f"✅ OTP email sent to {to_email}")
            return True

        print(f"❌ Brevo API error ({response.status_code}): {response.text}")
        return False

    except Exception as error:
        print(f"❌ Failed to send OTP email: {error}")
        return False
