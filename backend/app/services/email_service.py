import os
import smtplib
import random

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def generate_verification_code():
    """Generate a 6-digit verification code."""
    return str(random.randint(100000, 999999))


def send_verification_email(receiver_email: str, code: str):
    """Send verification code to user's email."""

    sender_email = os.getenv("MAIL_USERNAME")
    app_password = os.getenv("MAIL_PASSWORD")

    if not sender_email or not app_password:
        raise ValueError(
            "MAIL_USERNAME or MAIL_PASSWORD is missing from .env"
        )

    message = MIMEMultipart("alternative")

    message["Subject"] = "Verify your BudgetBuddy account"
    message["From"] = sender_email
    message["To"] = receiver_email

    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>BudgetBuddy Email Verification</h2>

            <p>
                Thank you for creating your BudgetBuddy account.
            </p>

            <p>Your verification code is:</p>

            <h1 style="letter-spacing: 6px;">
                {code}
            </h1>

            <p>
                This code will expire in 10 minutes.
            </p>

            <p>
                If you did not create this account,
                you can ignore this email.
            </p>
        </body>
    </html>
    """

    message.attach(
        MIMEText(html, "html")
    )

    with smtplib.SMTP_SSL(
        "smtp.gmail.com",
        465
    ) as server:

        server.login(
            sender_email,
            app_password
        )

        server.sendmail(
            sender_email,
            receiver_email,
            message.as_string()
        )