from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.crud.activity_log import log_activity


# Used by protected API endpoints to read the JWT access token.
#
# tokenUrl is used only by FastAPI Swagger/OpenAPI's "Authorize" button.
# Your actual application login endpoint is /auth/login, but it accepts
# JSON rather than OAuth2 form data. Therefore, the Swagger OAuth2 flow
# should use the dedicated /auth/swagger-login endpoint.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/swagger-login"
)


CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def _client_ip(request: Request | None) -> str | None:
    if request is None or request.client is None:
        return None

    return request.client.host


def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:

    if not token:
        raise CREDENTIALS_EXCEPTION

    payload = decode_token(token)

    if payload is None or payload.get("type") != "access":
        # Invalid or expired JWT.
        #
        # We don't know which user presented the token, so user_id is
        # intentionally None for this security event.
        log_activity(
            db,
            None,
            "invalid_token_attempt",
            detail=f"{request.method} {request.url.path}",
            ip_address=_client_ip(request),
            severity="security",
        )

        raise CREDENTIALS_EXCEPTION

    email = payload.get("sub")

    if email is None:
        raise CREDENTIALS_EXCEPTION

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None:
        raise CREDENTIALS_EXCEPTION

    # Primary-admin enforcement: the configured Admin email is the single
    # authoritative administrator account. This repairs legacy databases
    # where that account may still have role="user" and keeps the role correct
    # even after a refresh or an old JWT.
    from app.config import settings
    admin_email = str(settings.ADMIN_EMAIL).strip().lower()
    if user.email.strip().lower() == admin_email and user.role != "admin":
        user.role = "admin"
        user.account_tier = "premium"
        db.commit()
        db.refresh(user)

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:

    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "This account has been deactivated. "
                "Please contact support."
            ),
        )

    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Please verify your email address "
                "before continuing."
            ),
        )

    return current_user


def require_admin(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> User:

    if current_user.role != "admin":

        log_activity(
            db,
            current_user.id,
            "unauthorized_access_attempt",
            detail=(
                f"Non-admin attempted "
                f"{request.method} {request.url.path}"
            ),
            ip_address=_client_ip(request),
            severity="security",
        )

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Admin privileges are required "
                "to access this resource."
            ),
        )

    return current_user


def require_premium_user(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Gate for Premium-only functionality (advanced analytics, advanced
    reports, etc). Admins are always allowed through - they get
    Premium-level personal intelligence plus system-level analytics.
    Normal users (account_tier == "normal") are rejected with 403,
    even if they hit the endpoint directly via URL/curl - this check
    is server-side and cannot be bypassed from the frontend.
    """

    if current_user.role == "admin" or current_user.account_tier == "premium":
        return current_user

    log_activity(
        db,
        current_user.id,
        "unauthorized_premium_access_attempt",
        detail=f"Normal-tier user attempted {request.method} {request.url.path}",
        ip_address=_client_ip(request),
        severity="security",
    )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "This is a Premium feature. Upgrade to Premium "
            "to unlock advanced financial intelligence."
        ),
    )