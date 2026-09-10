from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, verify_password, hash_password, validate_password_strength
from app.core.email import (
    send_verification_email,
    send_welcome_email,
    send_password_reset_email,
    send_security_alert_email,
)
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.auth import (
    TokenResponse,
    MessageResponse,
    ResendVerificationRequest,
    VerifyEmailOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.crud.user import (
    get_user_by_email,
    create_user,
    mark_user_verified,
    update_last_login,
    change_user_password,
    normalize_email,
)
from app.crud.tokens import (
    create_email_verification_otp,
    get_valid_verification_otp,
    consume_verification_token,
    create_password_reset_token,
    get_valid_reset_token,
    consume_reset_token,
)
from app.crud.notification import create_notification_for_user_if_enabled
from app.crud.activity_log import log_activity
from app.models.user import User
from app.models.tokens import EmailVerificationToken
from app.config import settings
from app.core.sms import send_sms


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def _client_ip(request: Request) -> str | None:
    if request.client:
        return request.client.host
    return None


# =========================================================
# SIGNUP
# =========================================================

@router.post(
    "/signup",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def signup(
    user: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    email = normalize_email(user.email)

    existing_user = get_user_by_email(db, email)

    # -----------------------------------------------------
    # Existing verified account
    # -----------------------------------------------------

    if existing_user and existing_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please sign in instead.",
        )

    # -----------------------------------------------------
    # Existing unverified account
    #
    # This is important because a previous SMTP failure may
    # already have created the account.
    # -----------------------------------------------------

    if existing_user and not existing_user.is_verified:

        try:
            _, otp = create_email_verification_otp(
                db,
                existing_user.id,
            )

            await send_verification_email(
                existing_user.email,
                otp,
            )
            if existing_user.phone_number:
                send_sms(
                    existing_user.phone_number,
                    f"BudgetBuddy verification code: {otp}. It expires soon.",
                )

        except Exception as exc:
            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "An unverified account already exists for this email, "
                    "but the verification email could not be sent. "
                    "Check Gmail SMTP settings in backend/.env."
                ),
            ) from exc

        return {
            "message": (
                "This email already has an unverified account. "
                "A new verification code has been sent."
            )
        }

    # -----------------------------------------------------
    # Create new user
    # -----------------------------------------------------

    try:
        db_user = create_user(
            db,
            user,
        )

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered.",
        ) from exc

    # -----------------------------------------------------
    # Create verification OTP
    # -----------------------------------------------------

    try:
        _, otp = create_email_verification_otp(
            db,
            db_user.id,
        )

        await send_verification_email(
            db_user.email,
            otp,
        )

        # SMS is optional and best-effort; email remains the primary
        # verification channel. When Twilio is configured, the same OTP
        # can also be delivered to the user's registered phone.
        if db_user.phone_number:
            send_sms(
                db_user.phone_number,
                f"BudgetBuddy verification code: {otp}. It expires soon.",
            )

    except Exception as exc:

        # Keep the unverified account. This allows the user to use
        # Resend Verification after SMTP is fixed instead of losing
        # the account on a temporary mail-delivery failure.
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Account creation could not complete because the "
                "verification email could not be sent. "
                "Configure Gmail SMTP in backend/.env and try again."
            ),
        ) from exc

    # -----------------------------------------------------
    # Activity + notification
    # -----------------------------------------------------

    try:
        log_activity(
            db,
            db_user.id,
            "signup",
            detail="Account created",
            ip_address=_client_ip(request),
        )

        create_notification_for_user_if_enabled(
            db,
            db_user,
            title="Welcome to BudgetBuddy",
            message=(
                "Your account was created successfully. "
                "Please verify your email address."
            ),
            category="registration",
        )

    except Exception:
        # Do not break signup because an activity/notification
        # failed after the account was created.
        db.rollback()

    return {
        "message": (
            "Registration successful. "
            "A 6-digit verification code has been sent to your email."
        )
    }


# =========================================================
# VERIFY EMAIL
# =========================================================

@router.post(
    "/verify-email",
    response_model=MessageResponse,
)
def verify_email_otp(
    payload: VerifyEmailOTPRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    email = normalize_email(payload.email)

    user = get_user_by_email(
        db,
        email,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification email or code.",
        )

    if user.is_verified:
        return {
            "message": (
                "Your email is already verified. "
                "You can log in now."
            )
        }

    record = get_valid_verification_otp(
        db,
        user.id,
        str(payload.otp).strip(),
    )

    if not record:
        try:
            log_activity(
                db,
                user.id,
                "invalid_verification_attempt",
                detail="Invalid or expired verification OTP",
                ip_address=_client_ip(request),
                severity="warning",
            )
        except Exception:
            db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    mark_user_verified(
        db,
        user,
    )

    consume_verification_token(
        db,
        record,
    )

    try:
        log_activity(
            db,
            user.id,
            "email_verified",
            detail="Email verification completed",
            ip_address=_client_ip(request),
        )

        create_notification_for_user_if_enabled(
            db,
            user,
            title="Email verified",
            message=(
                "Your email address has been verified successfully."
            ),
            category="registration",
        )
    except Exception:
        db.rollback()

    # Welcome email must NOT be allowed to break verification.
    background_tasks.add_task(
        send_welcome_email,
        user.email,
        user.full_name or "there",
    )

    return {
        "message": (
            "Email verified successfully. "
            "You can now log in."
        )
    }


# =========================================================
# RESEND VERIFICATION
# =========================================================

@router.post(
    "/resend-verification",
    response_model=MessageResponse,
)
async def resend_verification(
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    email = normalize_email(payload.email)

    user = get_user_by_email(
        db,
        email,
    )

    generic_response = {
        "message": (
            "If an account exists and is not verified, "
            "a new verification code has been sent."
        )
    }

    if not user or user.is_verified:
        return generic_response

    from app.config import settings

    latest = (
        db.query(EmailVerificationToken)
        .filter(
            EmailVerificationToken.user_id == user.id
        )
        .order_by(
            EmailVerificationToken.id.desc()
        )
        .first()
    )

    if (
        latest
        and latest.created_at
        and latest.created_at
        > datetime.utcnow()
        - timedelta(
            seconds=settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS
        )
    ):
        remaining = settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS

        return {
            "message": (
                f"Please wait {remaining} seconds "
                "before requesting another code."
            )
        }

    try:
        _, otp = create_email_verification_otp(
            db,
            user.id,
        )

        await send_verification_email(
            user.email,
            otp,
        )
        if user.phone_number:
            send_sms(
                user.phone_number,
                f"BudgetBuddy verification code: {otp}. It expires soon.",
            )

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Verification email could not be sent. "
                "Check Gmail SMTP configuration in backend/.env."
            ),
        ) from exc

    return generic_response


# =========================================================
# LOGIN
# =========================================================

@router.post(
    "/login",
)
def login(
    user: UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    email = normalize_email(user.email)
    db_user = get_user_by_email(db, email)

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if not db_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated. Please contact support.")

    if not db_user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email address before logging in.")

    is_admin_email = email == normalize_email(settings.ADMIN_EMAIL)

    # Single login page: the account's role/tier is looked up from the
    # database record itself, never from a client-supplied field. There
    # is no "which tab did you click" selection to validate against
    # anymore, and normal/premium accounts are never rejected here based
    # on which UI button the person happened to press.

    # The configured administrator is always an administrator. The client can
    # never promote itself by selecting a plan on the login screen.
    if is_admin_email:
        db_user.role = "admin"
        db_user.account_tier = "premium"
        db.commit()
        db.refresh(db_user)

    # The account tier is stored on the account. Login never changes it.
    # The configured Admin email is handled above and remains Admin regardless
    # of any customer-tier selection in the UI.
    update_last_login(db, db_user)

    try:
        log_activity(db, db_user.id, "login", detail="Successful login", ip_address=_client_ip(request), severity="success")
        create_notification_for_user_if_enabled(db, db_user, title="New login", message="A new login to your BudgetBuddy account was detected.", category="login_alert")
    except Exception:
        db.rollback()

    access_token = create_access_token(data={"sub": db_user.email, "user_id": db_user.id, "role": db_user.role})
    return {"access_token": access_token, "token_type": "bearer", "user": db_user, "payment_required": False}

# =========================================================
# SWAGGER-ONLY LOGIN
#
# The application's real login endpoint (/auth/login) accepts JSON, but
# Swagger UI's "Authorize" button requires an OAuth2 password-flow endpoint
# that accepts application/x-www-form-urlencoded (username + password).
# core/deps.py's oauth2_scheme points its tokenUrl at this endpoint so that
# clicking "Authorize" in /docs actually works. It reuses the same
# password/verification/active checks as the real login endpoint.
# =========================================================

@router.post(
    "/swagger-login",
    response_model=TokenResponse,
    include_in_schema=False,
)
def swagger_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    email = normalize_email(form_data.username)

    db_user = get_user_by_email(db, email)

    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact support.",
        )

    if not db_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before logging in.",
        )

    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "user_id": db_user.id,
            "role": db_user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user,
    }


# =========================================================
# ADMIN BOOTSTRAP (protected "Create Admin Account" flow)
# =========================================================
# Public on purpose: it only ever reveals whether the ONE configured
# admin email already has an account, never who that email is or any
# other user's data. It never accepts a password from the client - the
# admin's real password always comes from ADMIN_PASSWORD in .env, so
# this can't be used to set/guess a password from the frontend.

@router.get("/admin-status")
def admin_status(db: Session = Depends(get_db)):
    email = normalize_email(settings.ADMIN_EMAIL)
    exists = db.query(User).filter(User.email == email).first() is not None
    return {"admin_exists": exists}


@router.post("/bootstrap-admin", response_model=MessageResponse)
def bootstrap_admin(db: Session = Depends(get_db)):
    email = normalize_email(settings.ADMIN_EMAIL)
    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The Admin account already exists. Please use Admin Login instead.",
        )

    password = settings.ADMIN_PASSWORD
    try:
        validate_password_strength(password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Cannot create Admin account: ADMIN_PASSWORD in backend/.env is too weak ({exc}). Fix it in .env and try again.",
        )

    admin_user = User(
        full_name=settings.ADMIN_NAME,
        email=email,
        hashed_password=hash_password(password),
        is_verified=True,
        is_active=True,
        role="admin",
        account_tier="premium",
    )
    db.add(admin_user)
    db.commit()
    return {"message": "Admin account created. You can now sign in from the Admin tab using the password configured in backend/.env."}


# =========================================================
# LOGOUT
# =========================================================

@router.post(
    "/logout",
    response_model=MessageResponse,
)
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        log_activity(
            db,
            current_user.id,
            "logout",
            detail="User logged out",
            ip_address=_client_ip(request),
            severity="success",
        )
    except Exception:
        db.rollback()

    return {
        "message": "Logged out successfully."
    }


# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
)
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    email = normalize_email(payload.email)

    user = get_user_by_email(
        db,
        email,
    )

    # Always return the same response.
    generic_response = {
        "message": (
            "If an account with that email exists, "
            "a password reset link has been sent."
        )
    }

    if not user:
        return generic_response

    reset_token = create_password_reset_token(
        db,
        user.id,
    )

    background_tasks.add_task(
        send_password_reset_email,
        user.email,
        reset_token.token,
    )

    return generic_response


# =========================================================
# RESET PASSWORD
# =========================================================

@router.post(
    "/reset-password/{token}",
    response_model=MessageResponse,
)
def reset_password(
    token: str,
    payload: ResetPasswordRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
):
    record = get_valid_reset_token(
        db,
        token,
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This password reset link is invalid "
                "or has expired."
            ),
        )

    user = (
        db.query(User)
        .filter(User.id == record.user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    change_user_password(
        db,
        user,
        payload.new_password,
    )

    consume_reset_token(
        db,
        record,
    )

    try:
        log_activity(
            db,
            user.id,
            "password_reset",
            detail="Password reset successfully",
            ip_address=_client_ip(request),
            severity="security",
        )

        create_notification_for_user_if_enabled(
            db,
            user,
            title="Password changed",
            message=(
                "Your password was reset successfully."
            ),
            category="password_changed",
        )
    except Exception:
        db.rollback()

    background_tasks.add_task(
        send_security_alert_email,
        user.email,
        "Your BudgetBuddy password was reset.",
    )

    return {
        "message": (
            "Password has been reset successfully. "
            "You can now log in with your new password."
        )
    }


# =========================================================
# CURRENT USER
# =========================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def read_current_user(
    current_user: User = Depends(get_current_user),
):
    return current_user