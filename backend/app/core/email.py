"""BudgetBuddy email service using Gmail SMTP."""

import asyncio
import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger("budgetbuddy.email")


def _send_sync(subject: str, recipient: str, html_body: str) -> None:
    if not recipient or not recipient.strip():
        raise ValueError("Recipient email address is required.")
    if not settings.email_configured:
        raise RuntimeError("Gmail SMTP is not configured. Set MAIL_USERNAME, MAIL_PASSWORD and MAIL_FROM in backend/.env.")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.MAIL_FROM
    msg["To"] = recipient.strip()
    msg.set_content("Please open this email in an HTML-capable mail client.")
    msg.add_alternative(html_body, subtype="html")

    context = ssl.create_default_context()
    if settings.MAIL_SSL_TLS:
        with smtplib.SMTP_SSL(settings.MAIL_SERVER, settings.MAIL_PORT, context=context, timeout=20) as server:
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.send_message(msg)
    else:
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=20) as server:
            server.ehlo()
            if settings.MAIL_STARTTLS:
                server.starttls(context=context)
                server.ehlo()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.send_message(msg)


async def _send_email(subject: str, recipient: str, html_body: str, console_fallback_text: str | None = None) -> None:
    """
    Send an email via Gmail SMTP.

    Local-development reliability: if Gmail SMTP credentials are not
    configured (MAIL_USERNAME/MAIL_PASSWORD/MAIL_FROM blank), we do NOT
    fail the calling request (this previously caused signup to always
    return 503 Service Unavailable in local dev). Instead we print the
    email content to the backend console so verification codes / reset
    links are still usable during local development. Verification is
    still required end-to-end; only the delivery channel changes.

    When SMTP *is* configured, real email is always sent and any SMTP
    failure is still raised so the caller can surface a proper error.
    """
    if not settings.email_configured:
        logger.warning(
            "SMTP is not configured (MAIL_USERNAME/MAIL_PASSWORD/MAIL_FROM "
            "blank in backend/.env). Printing email to console instead of "
            "sending it. Configure SMTP in backend/.env for real delivery."
        )
        print(
            "\n"
            "==================== LOCAL DEV EMAIL (SMTP not configured) ====================\n"
            f"To: {recipient}\n"
            f"Subject: {subject}\n"
            f"{console_fallback_text or ''}\n"
            "=================================================================================\n"
        )
        return

    try:
        await asyncio.to_thread(_send_sync, subject, recipient, html_body)
        logger.info("Email sent successfully to %s", recipient)
    except Exception:
        logger.exception("Failed to send email to %s", recipient)
        raise


def _verification_html(otp: str) -> str:
    return f"""
    <html><body style='font-family:Arial,sans-serif;background:#f5f7fb;padding:30px'>
      <div style='max-width:560px;margin:auto;background:#fff;padding:35px;border-radius:18px'>
        <h1 style='color:#2563eb'>BudgetBuddy</h1>
        <h2>Verify your email</h2>
        <p>Use this 6-digit code to verify your BudgetBuddy account:</p>
        <div style='margin:30px 0;padding:24px;background:#eef2ff;border-radius:16px;text-align:center'>
          <strong style='font-size:34px;letter-spacing:10px;color:#1d4ed8'>{otp}</strong>
        </div>
        <p>This code expires in <strong>{settings.EMAIL_VERIFICATION_OTP_EXPIRE_MINUTES} minutes</strong>.</p>
        <p>If you did not create this account, ignore this email.</p>
        <p style='color:#94a3b8'>— The BudgetBuddy Team</p>
      </div>
    </body></html>
    """


async def send_verification_email(email: str, otp: str) -> None:
    await _send_email(
        "BudgetBuddy - Email Verification Code",
        email,
        _verification_html(otp),
        console_fallback_text=f"Verification code: {otp}",
    )


async def send_welcome_email(email: str, full_name: str) -> None:
    await _send_email(
        "Welcome to BudgetBuddy 🎉",
        email,
        f"""<html><body style='font-family:Arial,sans-serif;background:#f5f7fb;padding:30px'>
        <div style='max-width:560px;margin:auto;background:#fff;padding:35px;border-radius:18px'>
        <h1 style='color:#2563eb'>Welcome to BudgetBuddy!</h1>
        <p>Hi <strong>{full_name or 'there'}</strong>,</p>
        <p>Your email has been successfully verified. Your BudgetBuddy account is now ready.</p>
        <p>Start managing your income, expenses, budgets and savings goals.</p>
        <p style='color:#94a3b8'>— The BudgetBuddy Team</p>
        </div></body></html>""",
        console_fallback_text=f"Welcome email for {full_name or email}.",
    )


async def send_password_reset_email(email: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{token}"
    await _send_email(
        "BudgetBuddy - Password Reset",
        email,
        f"""<html><body style='font-family:Arial,sans-serif'>
        <h2>Password reset</h2><p>Use the link below to reset your BudgetBuddy password:</p>
        <p><a href='{link}'>{link}</a></p>
        <p>This link expires in {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes.</p>
        </body></html>""",
        console_fallback_text=f"Password reset link: {link}",
    )


async def send_security_alert_email(email: str, message: str) -> None:
    await _send_email(
        "BudgetBuddy - Security Alert",
        email,
        f"""<html><body style='font-family:Arial,sans-serif'><h2>Security alert</h2><p>{message}</p></body></html>""",
        console_fallback_text=message,
    )
