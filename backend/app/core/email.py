"""BudgetBuddy email service using Resend HTTP API."""

import asyncio
import logging
from html import escape

import resend

from app.config import settings

logger = logging.getLogger("budgetbuddy.email")


def _email_configured() -> bool:
    return bool(
        settings.RESEND_API_KEY.strip()
        and settings.RESEND_FROM_EMAIL.strip()
    )


def _send_sync(subject: str, recipient: str, html_body: str) -> None:
    """Send one email synchronously using Resend."""

    if not recipient or not recipient.strip():
        raise ValueError("Recipient email address is required.")

    if not _email_configured():
        raise RuntimeError(
            "Resend email is not configured. "
            "Set RESEND_API_KEY and RESEND_FROM_EMAIL."
        )

    resend.api_key = settings.RESEND_API_KEY.strip()

    params = {
        "from": settings.RESEND_FROM_EMAIL.strip(),
        "to": [recipient.strip()],
        "subject": subject,
        "html": html_body,
    }

    resend.Emails.send(params)


async def _send_email(
    subject: str,
    recipient: str,
    html_body: str,
    console_fallback_text: str | None = None,
) -> None:
    """
    Send an email through Resend.

    If email delivery fails, log the error and print the
    verification/reset information so the application itself
    does not become unavailable.
    """

    if not _email_configured():
        logger.warning(
            "Resend is not configured. "
            "Using console fallback instead of sending email."
        )

        print(
            "\n"
            "==================== EMAIL FALLBACK ====================\n"
            f"To: {recipient}\n"
            f"Subject: {subject}\n"
            f"{console_fallback_text or ''}\n"
            "=========================================================\n"
        )
        return

    try:
        await asyncio.to_thread(
            _send_sync,
            subject,
            recipient,
            html_body,
        )

        logger.info(
            "Email sent successfully to %s",
            recipient,
        )

    except Exception:
        logger.exception(
            "Email delivery failed for %s. "
            "Using console fallback.",
            recipient,
        )

        print(
            "\n"
            "==================== EMAIL FALLBACK ====================\n"
            f"To: {recipient}\n"
            f"Subject: {subject}\n"
            f"{console_fallback_text or ''}\n"
            "=========================================================\n"
        )


def _verification_html(otp: str) -> str:
    return f"""
    <html>
    <body style="
        font-family: Arial, sans-serif;
        background: #f5f7fb;
        padding: 30px;
    ">
        <div style="
            max-width: 560px;
            margin: auto;
            background: #fff;
            padding: 35px;
            border-radius: 18px;
        ">
            <h1 style="color:#2563eb">
                BudgetBuddy
            </h1>

            <h2>
                Verify your email
            </h2>

            <p>
                Use this 6-digit code to verify your BudgetBuddy account:
            </p>

            <div style="
                margin:30px 0;
                padding:24px;
                background:#eef2ff;
                border-radius:16px;
                text-align:center;
            ">
                <strong style="
                    font-size:34px;
                    letter-spacing:10px;
                    color:#1d4ed8;
                ">
                    {escape(otp)}
                </strong>
            </div>

            <p>
                This code expires in
                <strong>
                    {settings.EMAIL_VERIFICATION_OTP_EXPIRE_MINUTES}
                    minutes
                </strong>.
            </p>

            <p>
                If you did not create this account, ignore this email.
            </p>

            <p style="color:#94a3b8">
                — The BudgetBuddy Team
            </p>
        </div>
    </body>
    </html>
    """


async def send_verification_email(
    email: str,
    otp: str,
) -> None:
    """Send the account verification OTP."""

    await _send_email(
        "BudgetBuddy - Email Verification Code",
        email,
        _verification_html(otp),
        console_fallback_text=f"Verification code: {otp}",
    )


async def send_welcome_email(
    email: str,
    full_name: str,
) -> None:
    """Send the welcome email after verification."""

    safe_name = escape(full_name or "there")

    html = f"""
    <html>
    <body style="
        font-family:Arial,sans-serif;
        background:#f5f7fb;
        padding:30px;
    ">
        <div style="
            max-width:560px;
            margin:auto;
            background:#fff;
            padding:35px;
            border-radius:18px;
        ">
            <h1 style="color:#2563eb">
                Welcome to BudgetBuddy!
            </h1>

            <p>
                Hi <strong>{safe_name}</strong>,
            </p>

            <p>
                Your email has been successfully verified.
                Your BudgetBuddy account is now ready.
            </p>

            <p>
                Start managing your income, expenses,
                budgets and savings goals.
            </p>

            <p style="color:#94a3b8">
                — The BudgetBuddy Team
            </p>
        </div>
    </body>
    </html>
    """

    await _send_email(
        "Welcome to BudgetBuddy 🎉",
        email,
        html,
        console_fallback_text=(
            f"Welcome email for {full_name or email}."
        ),
    )


async def send_password_reset_email(
    email: str,
    token: str,
) -> None:
    """Send password reset email."""

    link = (
        f"{settings.FRONTEND_URL.rstrip('/')}"
        f"/reset-password/{token}"
    )

    html = f"""
    <html>
    <body style="font-family:Arial,sans-serif">

        <h2>
            Password reset
        </h2>

        <p>
            Use the link below to reset your BudgetBuddy password:
        </p>

        <p>
            <a href="{escape(link)}">
                {escape(link)}
            </a>
        </p>

        <p>
            This link expires in
            {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES}
            minutes.
        </p>

    </body>
    </html>
    """

    await _send_email(
        "BudgetBuddy - Password Reset",
        email,
        html,
        console_fallback_text=f"Password reset link: {link}",
    )


async def send_security_alert_email(
    email: str,
    message: str,
) -> None:
    """Send a security alert email."""

    html = f"""
    <html>
    <body style="font-family:Arial,sans-serif">

        <h2>
            Security alert
        </h2>

        <p>
            {escape(message)}
        </p>

    </body>
    </html>
    """

    await _send_email(
        "BudgetBuddy - Security Alert",
        email,
        html,
        console_fallback_text=message,
    )