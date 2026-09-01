import os
import requests


# ============================================================
# CONFIG (read from environment variables set on Render)
# ============================================================

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# This must be an email address you've verified as a sender
# in Brevo (Settings -> Senders & IP).
FROM_EMAIL = os.getenv("FROM_EMAIL")
FROM_NAME = "ExamAce AI"

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


# ============================================================
# SEND VERIFICATION EMAIL
# ============================================================

def send_verification_email(to_email: str, token: str) -> bool:
    """
    Sends a verification email via Brevo's HTTP API.

    Returns True if sent successfully, False otherwise.
    """

    if not BREVO_API_KEY or not FROM_EMAIL:
        print("⚠️ Brevo API key or FROM_EMAIL is not configured.")
        return False

    verification_link = f"{FRONTEND_URL}/verify?token={token}"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2 style="color:#2563eb;">Welcome to ExamAce AI 🎓</h2>
        <p>Thanks for signing up! Please verify your email address to activate your account.</p>
        <p style="text-align:center; margin: 30px 0;">
            <a href="{verification_link}"
               style="background:#2563eb; color:#fff; padding:12px 24px;
                      text-decoration:none; border-radius:8px; font-weight:bold;">
                Verify My Email
            </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break:break-all; color:#2563eb;">{verification_link}</p>
        <hr style="margin:30px 0; border:none; border-top:1px solid #eee;">
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
        "subject": "Verify your ExamAce AI account",
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
            print(f"✅ Verification email sent to {to_email}")
            return True

        print(f"❌ Brevo API error ({response.status_code}): {response.text}")
        return False

    except Exception as error:
        print(f"❌ Failed to send verification email: {error}")
        return False
