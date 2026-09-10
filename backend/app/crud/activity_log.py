from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog

# Actions that should default to "warning"/"security" severity even when the
# caller doesn't pass severity explicitly, so existing call sites written
# before severity existed are still classified sensibly.
_WARNING_ACTIONS = {
    "login_failed",
    "login_blocked",
    "budget_nearing_limit",
    "budget_exceeded",
    "invalid_verification_attempt",
    "invalid_reset_attempt",
}
_SECURITY_ACTIONS = {
    "password_changed",
    "password_reset",
    "unauthorized_access_attempt",
    "invalid_token_attempt",
    "account_deleted_by_self",
}
_SUCCESS_PREFIXES = (
    "signup", "login", "logout", "email_verified", "bank_account_",
    "income_", "expense_", "budget_created", "budget_updated", "budget_deleted",
    "savings_goal_", "admin_activated", "admin_reactivated", "profile_updated",
    "settings_updated",
)


def _infer_severity(action: str) -> str:
    if action in _SECURITY_ACTIONS:
        return "security"
    if action in _WARNING_ACTIONS:
        return "warning"
    if any(action.startswith(p) for p in _SUCCESS_PREFIXES):
        return "success"
    return "info"


def log_activity(
    db: Session,
    user_id: int | None,
    action: str,
    detail: str | None = None,
    ip_address: str | None = None,
    severity: str | None = None,
) -> ActivityLog:
    entry = ActivityLog(
        user_id=user_id,
        action=action,
        detail=detail,
        ip_address=ip_address,
        severity=severity or _infer_severity(action),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_activity_logs(db: Session, skip: int = 0, limit: int = 200) -> list[ActivityLog]:
    return (
        db.query(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_user_activity_logs(db: Session, user_id: int, limit: int = 50) -> list[ActivityLog]:
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == user_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )
