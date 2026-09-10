from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_active_user
from app.core.security import verify_password
from app.core.email import send_security_alert_email
from app.models.user import User

from app.schemas.user import (
    UserResponse,
    UserUpdate,
    ChangePasswordRequest,
    NotificationPreferencesUpdate,
    ThemeUpdate,
)

from app.crud.user import (
    get_user_by_email,
    update_user_profile_fields,
    change_user_password,
    update_notification_preferences,
    update_theme,
    delete_user,
)
from app.crud.notification import create_notification_for_user_if_enabled
from app.crud.activity_log import log_activity

router = APIRouter(prefix="/settings", tags=["Settings"])


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


@router.put("/profile", response_model=UserResponse)
def update_profile_settings(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if payload.email and payload.email != current_user.email:
        existing = get_user_by_email(db, payload.email)
        if existing:
            raise HTTPException(status_code=400, detail="That email is already in use.")

    user = update_user_profile_fields(db, current_user, payload.full_name, payload.email)
    log_activity(db, user.id, "profile_updated")
    return user


@router.put("/password")
def change_password(
    payload: ChangePasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    change_user_password(db, current_user, payload.new_password)
    log_activity(db, current_user.id, "password_changed")
    create_notification_for_user_if_enabled(
        db, current_user,
        title="Password changed",
        message="Your password was changed successfully.",
        category="password_changed",
    )
    background_tasks.add_task(
        send_security_alert_email, current_user.email, "Your account password was changed."
    )

    return {"message": "Password updated successfully."}


@router.put("/notification-preferences", response_model=UserResponse)
def update_notifications(
    payload: NotificationPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    user = update_notification_preferences(
        db, current_user, payload.email_notifications_enabled, payload.app_notifications_enabled
    )
    log_activity(db, current_user.id, "settings_updated", detail="notification preferences")
    return user


@router.put("/theme", response_model=UserResponse)
def update_theme_setting(
    payload: ThemeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    user = update_theme(db, current_user, payload.theme)
    log_activity(db, current_user.id, "settings_updated", detail=f"theme -> {payload.theme}")
    return user


@router.delete("/account")
def delete_my_account(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    log_activity(db, current_user.id, "account_deleted_by_self", ip_address=_client_ip(request))
    delete_user(db, current_user)
    return {"message": "Your account and all associated data has been deleted."}
