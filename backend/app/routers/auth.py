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
from app.models.subscription_request import SubscriptionRequest

from app.crud.user import (
    get_user_by_email,
    create_user,
)

from app.core.security import (
    verify_password,
    create_access_token,
)

from app.core.deps import get_current_user

from app.services.email_service import (
    generate_verification_code,
    send_verification_email,
)


# =========================================================
# Authentication Router
# =========================================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# =========================================================
# Signup
# =========================================================

@router.post("/signup")
def signup(
    user: UserCreate,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Check Existing User
    # -----------------------------------------------------

    existing_user = get_user_by_email(
        db,
        user.email,
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    # -----------------------------------------------------
    # Create User
    # -----------------------------------------------------

    new_user = create_user(
        db=db,
        email=user.email,
        password=user.password,
        full_name=user.full_name,
    )

    # -----------------------------------------------------
    # Generate Verification OTP
    # -----------------------------------------------------

    verification_code = (
        generate_verification_code()
    )

    new_user.verification_code = (
        verification_code
    )

    new_user.verification_code_expires_at = (
        datetime.utcnow()
        + timedelta(minutes=10)
    )

    new_user.is_email_verified = False

    # -----------------------------------------------------
    # New Users Are Active
    # -----------------------------------------------------

    new_user.is_active = True

    # create_user() creates normal users
    # with the default "student" role.

    db.commit()
    db.refresh(new_user)

    # -----------------------------------------------------
    # Send Verification Email
    # -----------------------------------------------------

    try:

        send_verification_email(
            new_user.email,
            verification_code,
        )

    except Exception as e:

        print(
            "EMAIL ERROR:",
            str(e),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Account created, but verification "
                "email could not be sent."
            ),
        )

    return {
        "message": (
            "Account created. Verification "
            "code sent to your email."
        ),
        "email": new_user.email,
    }


# =========================================================
# Verify Email
# =========================================================

@router.post("/verify-email")
def verify_email(
    email: str,
    code: str,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Find User
    # -----------------------------------------------------

    user = get_user_by_email(
        db,
        email,
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # -----------------------------------------------------
    # Already Verified
    # -----------------------------------------------------

    if user.is_email_verified:

        return {
            "message": "Email is already verified.",
        }

    # -----------------------------------------------------
    # Check Verification Code
    # -----------------------------------------------------

    if not user.verification_code:

        raise HTTPException(
            status_code=400,
            detail="No verification code found.",
        )

    if user.verification_code != code:

        raise HTTPException(
            status_code=400,
            detail="Invalid verification code.",
        )

    # -----------------------------------------------------
    # Check Expiration
    # -----------------------------------------------------

    if (
        not user.verification_code_expires_at
        or datetime.utcnow()
        > user.verification_code_expires_at
    ):

        raise HTTPException(
            status_code=400,
            detail="Verification code has expired.",
        )

    # -----------------------------------------------------
    # Verify Email
    # -----------------------------------------------------

    user.is_email_verified = True

    user.verification_code = None

    user.verification_code_expires_at = None

    db.commit()

    return {
        "message": "Email verified successfully.",
    }


# =========================================================
# Resend Verification Code
# =========================================================

@router.post("/resend-verification")
def resend_verification(
    email: str,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Find User
    # -----------------------------------------------------

    user = get_user_by_email(
        db,
        email,
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # -----------------------------------------------------
    # Already Verified
    # -----------------------------------------------------

    if user.is_email_verified:

        raise HTTPException(
            status_code=400,
            detail="Email is already verified.",
        )

    # -----------------------------------------------------
    # Generate New OTP
    # -----------------------------------------------------

    new_code = (
        generate_verification_code()
    )

    user.verification_code = new_code

    user.verification_code_expires_at = (
        datetime.utcnow()
        + timedelta(minutes=10)
    )

    db.commit()

    # -----------------------------------------------------
    # Send Email
    # -----------------------------------------------------

    try:

        send_verification_email(
            user.email,
            new_code,
        )

    except Exception as e:

        print(
            "EMAIL ERROR:",
            str(e),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Verification email "
                "could not be sent."
            ),
        )

    return {
        "message": "New verification code sent.",
    }


# =========================================================
# Login
# =========================================================

@router.post(
    "/login",
    response_model=Token,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Find User
    # -----------------------------------------------------

    user = get_user_by_email(
        db,
        form_data.username,
    )

    # -----------------------------------------------------
    # Verify Credentials
    # -----------------------------------------------------

    if (
        not user
        or not verify_password(
            form_data.password,
            user.hashed_password,
        )
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
        )

    # -----------------------------------------------------
    # Check Active Status
    # -----------------------------------------------------

    if not user.is_active:

        raise HTTPException(
            status_code=403,
            detail="Your account has been deactivated.",
        )

    # -----------------------------------------------------
    # Check Email Verification
    # -----------------------------------------------------

    if not user.is_email_verified:

        raise HTTPException(
            status_code=403,
            detail=(
                "Please verify your email "
                "before logging in."
            ),
        )

    # -----------------------------------------------------
    # Create JWT
    # -----------------------------------------------------

    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# =========================================================
# Current Logged-in User
# =========================================================

@router.get(
    "/me",
    response_model=UserOut,
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
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


# =========================================================
# Request Premium Subscription
# =========================================================

@router.post("/request-premium")
def request_premium(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Admin Already Has Full Access
    # -----------------------------------------------------

    if current_user.role == "admin":

        raise HTTPException(
            status_code=400,
            detail=(
                "Admin users already have "
                "full access."
            ),
        )

    # -----------------------------------------------------
    # Already Premium
    # -----------------------------------------------------

    if current_user.role == "premium":

        raise HTTPException(
            status_code=400,
            detail=(
                "You are already a Premium user."
            ),
        )

    # -----------------------------------------------------
    # Only Students Can Request Premium
    # -----------------------------------------------------

    if current_user.role != "student":

        raise HTTPException(
            status_code=400,
            detail=(
                "Only student accounts can "
                "request Premium."
            ),
        )

    # -----------------------------------------------------
    # Check Existing Pending Request
    # -----------------------------------------------------

    existing_request = (
        db.query(SubscriptionRequest)
        .filter(
            SubscriptionRequest.user_id
            == current_user.id,

            SubscriptionRequest.status
            == "pending",
        )
        .first()
    )

    if existing_request:

        return {
            "message": (
                "Your Premium subscription "
                "request is already pending."
            ),

            "request_id": (
                existing_request.id
            ),

            "status": "pending",
        }

    # -----------------------------------------------------
    # Create Subscription Request
    # -----------------------------------------------------

    subscription_request = SubscriptionRequest(
        user_id=current_user.id,
        plan="premium",
        status="pending",
    )

    db.add(subscription_request)

    db.commit()

    db.refresh(subscription_request)

    # -----------------------------------------------------
    # Return Request Information
    # -----------------------------------------------------

    return {
        "message": (
            "Premium subscription request "
            "sent to the administrator."
        ),

        "request_id": (
            subscription_request.id
        ),

        "status": (
            subscription_request.status
        ),

        "plan": (
            subscription_request.plan
        ),
    }


# =========================================================
# Remove Premium Subscription
# =========================================================

@router.patch("/remove-premium")
def remove_premium_subscription(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Admin Protection
    # -----------------------------------------------------

    if current_user.role == "admin":

        raise HTTPException(
            status_code=400,
            detail=(
                "Admin users cannot remove "
                "Premium access."
            ),
        )

    # -----------------------------------------------------
    # Check Premium Status
    # -----------------------------------------------------

    if current_user.role != "premium":

        raise HTTPException(
            status_code=400,
            detail=(
                "You do not have an active "
                "Premium subscription."
            ),
        )

    # -----------------------------------------------------
    # Find Latest Approved Subscription
    # -----------------------------------------------------

    approved_request = (
        db.query(SubscriptionRequest)
        .filter(
            SubscriptionRequest.user_id
            == current_user.id,

            SubscriptionRequest.status
            == "approved",
        )
        .order_by(
            SubscriptionRequest.created_at.desc()
        )
        .first()
    )

    # -----------------------------------------------------
    # Change Premium → Student
    # -----------------------------------------------------

    current_user.role = "student"

    # -----------------------------------------------------
    # Mark Subscription as Cancelled
    # -----------------------------------------------------

    if approved_request:

        approved_request.status = "cancelled"

    # -----------------------------------------------------
    # Save Changes
    # -----------------------------------------------------

    db.commit()

    db.refresh(current_user)

    if approved_request:

        db.refresh(approved_request)

    # -----------------------------------------------------
    # Return Updated Information
    # -----------------------------------------------------

    return {

        "message": (
            "Premium subscription "
            "removed successfully."
        ),

        "user_id": current_user.id,

        "email": current_user.email,

        "role": current_user.role,

        "subscription_status": (
            approved_request.status
            if approved_request
            else "cancelled"
        ),

    }


# =========================================================
# Delete Account
# =========================================================

@router.delete("/account")
def delete_account(
    request: DeleteAccountRequest,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Verify Password
    # -----------------------------------------------------

    if not verify_password(
        request.password,
        current_user.hashed_password,
    ):

        raise HTTPException(
            status_code=401,
            detail="Incorrect password.",
        )

    # -----------------------------------------------------
    # Delete User
    # -----------------------------------------------------

    db.delete(current_user)

    db.commit()

    return {
        "message": "Account deleted successfully.",
    }