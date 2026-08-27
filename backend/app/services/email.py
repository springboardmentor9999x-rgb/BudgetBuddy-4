import os
import smtplib
from html import escape
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()


def send_verification_email(to_email: str, code: str):
    safe_code = escape(code)

    msg = EmailMessage()
    msg["Subject"] = "Your BudgetBuddy verification code"
    msg["From"] = os.getenv("SMTP_FROM", "no-reply@example.com")
    msg["To"] = to_email
    msg.set_content(
        f"Your BudgetBuddy verification code is: {code}\n\n"
        "Enter this code in the verification screen. It expires in 24 hours."
    )
    msg.add_alternative(
        f"""
        <html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033;">
          <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(16,24,40,.12);">
            <div style="padding:28px 32px;background:#1d4ed8;color:#fff;"><h1 style="margin:0;font-size:24px;">BudgetBuddy</h1></div>
            <div style="padding:32px;"><h2 style="margin-top:0;">Verify your email</h2><p>Thanks for creating a BudgetBuddy account. Enter this code in the verification screen:</p>
              <div style="margin:24px 0;padding:18px;text-align:center;background:#eff6ff;border-radius:10px;font-size:28px;font-weight:700;letter-spacing:8px;color:#1d4ed8;">{safe_code}</div>
              <p style="color:#667085;">This code expires in 24 hours. Do not share it with anyone.</p>
            </div>
          </div>
        </body></html>
        """,
        subtype="html",
    )

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_user or not smtp_password:
        raise RuntimeError("SMTP_USER and SMTP_PASSWORD must be set in backend/.env")

    with smtplib.SMTP(smtp_host, smtp_port) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(smtp_user, smtp_password)
        smtp.send_message(msg)


def send_password_reset_email(to_email: str, code: str):
    safe_code = escape(code)
    msg = EmailMessage()
    msg["Subject"] = "Your BudgetBuddy password reset code"
    msg["From"] = os.getenv("SMTP_FROM", "no-reply@example.com")
    msg["To"] = to_email
    msg.set_content(
        f"Your BudgetBuddy password reset code is: {code}\n\n"
        "Enter this code to reset your password. It expires in 15 minutes."
    )
    msg.add_alternative(
        f"""
        <html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033;">
          <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(16,24,40,.12);">
            <div style="padding:28px 32px;background:#1d4ed8;color:#fff;"><h1 style="margin:0;font-size:24px;">BudgetBuddy</h1></div>
            <div style="padding:32px;"><h2 style="margin-top:0;">Reset your password</h2><p>Enter this code to choose a new password:</p>
              <div style="margin:24px 0;padding:18px;text-align:center;background:#eff6ff;border-radius:10px;font-size:28px;font-weight:700;letter-spacing:8px;color:#1d4ed8;">{safe_code}</div>
              <p style="color:#667085;">This code expires in 15 minutes. Do not share it with anyone.</p>
            </div>
          </div>
        </body></html>
        """,
        subtype="html",
    )
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    if not smtp_user or not smtp_password:
        raise RuntimeError("SMTP_USER and SMTP_PASSWORD must be set in backend/.env")
    with smtplib.SMTP(smtp_host, smtp_port) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(smtp_user, smtp_password)
        smtp.send_message(msg)
