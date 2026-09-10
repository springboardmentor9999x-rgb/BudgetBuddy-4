"""
SMS provider abstraction.

Configured entirely through environment variables (see .env.example):

    SMS_PROVIDER=twilio
    TWILIO_ACCOUNT_SID=...
    TWILIO_AUTH_TOKEN=...
    TWILIO_PHONE_NUMBER=...

If SMS_PROVIDER is unset/empty, or credentials are missing, or the
`twilio` package isn't installed, send_sms() NEVER raises - it logs the
message that would have been sent and returns False. Nothing in the
app should ever crash because SMS isn't configured; treat it exactly
like the email fallback in core/email.py.
"""
import logging

from app.config import settings

logger = logging.getLogger("budgetbuddy.sms")


def send_sms(to_phone_number: str, message: str) -> bool:
    """
    Best-effort SMS send. Returns True only if a real send was
    attempted and Twilio did not raise. Any misconfiguration,
    missing package, or provider error is caught and logged - callers
    should not (and do not need to) wrap this in their own try/except.
    """

    if not to_phone_number:
        logger.info("SMS skipped (no phone number on file): %s", message)
        return False

    if not settings.sms_configured:
        logger.info(
            "SMS not configured (SMS_PROVIDER/TWILIO_* unset in .env) - "
            "would have sent to %s: %s",
            to_phone_number,
            message,
        )
        return False

    provider = settings.SMS_PROVIDER.strip().lower()

    if provider == "twilio":
        return _send_via_twilio(to_phone_number, message)

    logger.warning("Unknown SMS_PROVIDER '%s' - SMS not sent.", settings.SMS_PROVIDER)
    return False


def _send_via_twilio(to_phone_number: str, message: str) -> bool:
    try:
        from twilio.rest import Client
    except ImportError:
        logger.warning(
            "SMS_PROVIDER=twilio but the 'twilio' package isn't installed. "
            "Run: pip install twilio"
        )
        return False

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            to=to_phone_number,
            from_=settings.TWILIO_PHONE_NUMBER,
            body=message,
        )
        return True
    except Exception:
        logger.exception("Twilio SMS send failed for %s", to_phone_number)
        return False
