import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


# ============================================================
# CONFIG (read from environment variables set on Render)
# ============================================================

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_LOGIN = os.getenv("SMTP_LOGIN")
SMTP_KEY = os.getenv("SMTP_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# This is the "From" address shown to the recipient.
# Brevo lets you send from any verified sender - set this
# to an email you verified in your Brevo dashboard.
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_LOGIN)
FROM_NAME = "ExamAce AI"


# ============================================================
# SEND VERIFICATION EMAIL
# ============================================================

def send_verification_email(to_email: str, token: str) -> bool:
    """
    Sends a verification email containing a link the user
    must click to confirm their account.

    Returns True if sent successfully, False otherwise.
    """

    if not SMTP_LOGIN or not SMTP_KEY:
        print("⚠️ SMTP credentials are not configured.")
        return False

    verification_link = f"{FRONTEND_URL}/verify?token={token}"

    subject = "Verify your ExamAce AI account"

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

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
    message["To"] = to_email

    message.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_LOGIN, SMTP_KEY)
            server.sendmail(FROM_EMAIL, to_email, message.as_string())

        print(f"✅ Verification email sent to {to_email}")
        return True

    except Exception as error:
        print(f"❌ Failed to send verification email: {error}")
        return False