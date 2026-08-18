from datetime import datetime, timedelta, timezone
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.auth import (
    Signup,
    Login,
    ResetPassword,
    VerifyEmailCode,
)

from app.crud.user import (
    get_user_by_email
)

from app.core.security import (
    verify_password,
    create_access_token,
    hash_password
)

from app.models.user import User
from app.models.pending_user import PendingUser
from app.models.profile import Profile
from app.services.email import send_verification_email
from app.core.deps import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

def validate_bcrypt_password(password: str):
    """bcrypt accepts passwords up to 72 UTF-8 bytes."""
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=422,
            detail="Password must be at most 72 bytes long."
        )


def generate_verification_code():
    return "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))


# =========================
# SIGNUP
# =========================

@router.post("/signup")
def signup(
    user: Signup,
    db: Session = Depends(get_db)
):
    validate_bcrypt_password(user.password)
    email = user.email.lower()
    existing = get_user_by_email(db, email)

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    code = generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    pending_user = db.query(PendingUser).filter(PendingUser.email == email).first()
    if pending_user:
        pending_user.full_name = user.full_name
        pending_user.password = hash_password(user.password)
        pending_user.verification_token = hash_password(code)
        pending_user.expires_at = expires_at
    else:
        pending_user = PendingUser(
            full_name=user.full_name,
            email=email,
            password=hash_password(user.password),
            verification_token=hash_password(code),
            expires_at=expires_at,
        )
        db.add(pending_user)

    db.commit()

    try:
        send_verification_email(email, code)
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Unable to send the verification email. Check the SMTP settings and try again."
        )

    return {
        "message": "Verification email sent. Please verify your email to create the account."
    }


# =========================
# VERIFY EMAIL
# =========================

@router.post("/verify-email")
def verify_email(
    data: VerifyEmailCode,
    db: Session = Depends(get_db)
):
    email = data.email.lower()
    pending_user = db.query(PendingUser).filter(
        PendingUser.email == email,
    ).first()

    if not pending_user:
        raise HTTPException(status_code=400, detail="Invalid email or verification code")

    if pending_user.expires_at < datetime.now(timezone.utc):
        db.delete(pending_user)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code expired. Please sign up again.")

    if not verify_password(data.code, pending_user.verification_token):
        raise HTTPException(status_code=400, detail="Invalid email or verification code")

    new_user = User(
        full_name=pending_user.full_name,
        email=pending_user.email,
        password=pending_user.password,
        is_verified=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.add(Profile(user_id=new_user.id))
    db.delete(pending_user)
    db.commit()

    return {
        "message": "Account created successfully"
    }


# =========================
# LOGIN
# =========================

@router.post("/login")
def login(
    user: Login,
    db: Session = Depends(get_db)
):
    validate_bcrypt_password(user.password)
    db_user = get_user_by_email(db, user.email)

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not db_user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before signing in."
        )

    token = create_access_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    """JWT round-trip endpoint and authenticated user identity for clients."""
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "is_verified": current_user.is_verified,
    }


# =========================
# RESET PASSWORD
# =========================

@router.post("/reset-password")
def reset_password(
    data: ResetPassword,
    db: Session = Depends(get_db)
):
    validate_bcrypt_password(data.new_password)
    user = get_user_by_email(db, data.email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email is not registered"
        )

    user.password = hash_password(data.new_password)

    db.commit()
    db.refresh(user)

    return {
        "message": "Password reset successfully"
    }
