from datetime import datetime, timedelta
import hashlib
import secrets
import hmac

from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import generate_url_safe_token
from app.models.tokens import EmailVerificationToken, PasswordResetToken


def _hash_otp(user_id: int, otp: str) -> str:
    # OTP is never stored in plaintext. The application secret binds the OTP
    # to this BudgetBuddy installation and user.
    raw = f"{settings.SECRET_KEY}:{user_id}:{otp}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def create_email_verification_otp(db: Session, user_id: int) -> tuple[EmailVerificationToken, str]:
    # Only one active verification challenge should exist at a time.
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user_id,
        EmailVerificationToken.used.is_(False),
    ).update({"used": True}, synchronize_session=False)

    otp = "".join(str(secrets.randbelow(10)) for _ in range(settings.EMAIL_VERIFICATION_OTP_LENGTH))
    record = EmailVerificationToken(
        user_id=user_id,
        # Keep the legacy column populated with a random opaque value so old
        # database constraints remain satisfied. It is not used as the OTP.
        token=generate_url_safe_token(),
        otp_hash=_hash_otp(user_id, otp),
        attempts=0,
        expires_at=datetime.utcnow() + timedelta(minutes=settings.EMAIL_VERIFICATION_OTP_EXPIRE_MINUTES),
        used=False,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record, otp


def get_valid_verification_otp(db: Session, user_id: int, otp: str) -> EmailVerificationToken | None:
    record = (
        db.query(EmailVerificationToken)
        .filter(
            EmailVerificationToken.user_id == user_id,
            EmailVerificationToken.used.is_(False),
            EmailVerificationToken.otp_hash.is_not(None),
        )
        .order_by(EmailVerificationToken.id.desc())
        .first()
    )
    if not record or record.expires_at < datetime.utcnow():
        return None

    if record.attempts >= settings.EMAIL_VERIFICATION_MAX_ATTEMPTS:
        return None

    record.attempts += 1
    db.flush()

    candidate = _hash_otp(user_id, otp)
    if not hmac.compare_digest(record.otp_hash or "", candidate):
        db.commit()
        return None

    db.commit()
    return record


def consume_verification_token(db: Session, record: EmailVerificationToken) -> None:
    record.used = True
    db.commit()


# ---------------- Password reset ----------------

def create_password_reset_token(db: Session, user_id: int) -> PasswordResetToken:
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user_id,
        PasswordResetToken.used.is_(False),
    ).update({"used": True}, synchronize_session=False)

    token = PasswordResetToken(
        user_id=user_id,
        token=generate_url_safe_token(),
        expires_at=datetime.utcnow()
        + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


def get_valid_reset_token(db: Session, token: str) -> PasswordResetToken | None:
    record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token == token)
        .first()
    )
    if not record:
        return None
    if record.used or record.expires_at < datetime.utcnow():
        return None
    return record


def consume_reset_token(db: Session, record: PasswordResetToken) -> None:
    record.used = True
    db.commit()
