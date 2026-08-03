from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import (
    UserCreate,
    UserOut,
    Token,
    DeleteAccountRequest,
)
from app.models.user import User
from app.crud.user import get_user_by_email, create_user
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user

from app.services.email_service import (
    generate_verification_code,
    send_verification_email,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# --------------------------------------------------
# Signup
# --------------------------------------------------
@router.post("/signup")
def signup(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = get_user_by_email(
        db,
        user.email
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create user
    new_user = create_user(
        db=db,
        email=user.email,
        password=user.password,
        full_name=user.full_name
    )

    # Generate 6-digit OTP
    verification_code = generate_verification_code()

    # Save OTP and expiry time
    new_user.verification_code = verification_code

    new_user.verification_code_expires_at = (
        datetime.utcnow() + timedelta(minutes=10)
    )

    new_user.is_email_verified = False

    db.commit()
    db.refresh(new_user)

    # Send OTP to user's email
    try:
        send_verification_email(
            new_user.email,
            verification_code
        )

    except Exception as e:
        print("EMAIL ERROR:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Account created, but verification email could not be sent."
        )

    return {
        "message": "Account created. Verification code sent to your email.",
        "email": new_user.email
    }


# --------------------------------------------------
# Verify Email
# --------------------------------------------------
@router.post("/verify-email")
def verify_email(
    email: str,
    code: str,
    db: Session = Depends(get_db)
):
    user = get_user_by_email(
        db,
        email
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.is_email_verified:
        return {
            "message": "Email is already verified."
        }

    if not user.verification_code:
        raise HTTPException(
            status_code=400,
            detail="No verification code found."
        )

    if user.verification_code != code:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification code."
        )

    if (
        not user.verification_code_expires_at
        or datetime.utcnow()
        > user.verification_code_expires_at
    ):
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired."
        )

    user.is_email_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None

    db.commit()

    return {
        "message": "Email verified successfully."
    }


# --------------------------------------------------
# Resend Verification Code
# --------------------------------------------------
@router.post("/resend-verification")
def resend_verification(
    email: str,
    db: Session = Depends(get_db)
):
    user = get_user_by_email(
        db,
        email
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.is_email_verified:
        raise HTTPException(
            status_code=400,
            detail="Email is already verified."
        )

    new_code = generate_verification_code()

    user.verification_code = new_code

    user.verification_code_expires_at = (
        datetime.utcnow() + timedelta(minutes=10)
    )

    db.commit()

    try:
        send_verification_email(
            user.email,
            new_code
        )

    except Exception as e:
        print("EMAIL ERROR:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Verification email could not be sent."
        )

    return {
        "message": "New verification code sent."
    }


# --------------------------------------------------
# Login
# --------------------------------------------------
@router.post(
    "/login",
    response_model=Token
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = get_user_by_email(
        db,
        form_data.username
    )

    if not user or not verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    # Prevent unverified users from logging in
    if not user.is_email_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before logging in."
        )

    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# --------------------------------------------------
# Current Logged-in User
# --------------------------------------------------
@router.get(
    "/me",
    response_model=UserOut
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        full_name=(
            current_user.profile.full_name
            if current_user.profile
            else None
        ),
    )


# --------------------------------------------------
# Delete Account
# --------------------------------------------------
@router.delete("/account")
def delete_account(
    request: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check user's current BudgetBuddy password
    if not verify_password(
        request.password,
        current_user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password."
        )

    # Permanently delete the user
    db.delete(current_user)
    db.commit()

    return {
        "message": "Account deleted successfully."
    }