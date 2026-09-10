from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password


def normalize_email(email: str) -> str:
    return str(email).strip().lower()


def get_user_by_email(
    db: Session,
    email: str,
) -> User | None:

    normalized = normalize_email(email)

    return (
        db.query(User)
        .filter(
            func.lower(User.email) == normalized
        )
        .first()
    )


def get_user_by_id(
    db: Session,
    user_id: int,
) -> User | None:

    return (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )


def create_user(
    db: Session,
    user: UserCreate,
) -> User:

    db_user = User(
        full_name=user.full_name.strip(),
        email=normalize_email(user.email),
        phone_number=user.phone_number,
        hashed_password=hash_password(
            user.password
        ),
        is_verified=False,
        is_active=True,
        role="user",
        # Every new signup starts as a Normal account, full stop.
        # `requested_tier` is a client-supplied field and must never be
        # trusted to grant Premium - Premium is only ever granted by an
        # admin approving a premium_request (see crud/premium_request.py),
        # which upgrades this same user row rather than creating a new one.
        account_tier="normal",
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def mark_user_verified(
    db: Session,
    user: User,
) -> User:

    user.is_verified = True

    db.commit()
    db.refresh(user)

    return user


def update_last_login(
    db: Session,
    user: User,
) -> User:

    user.last_login_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    return user


def change_user_password(
    db: Session,
    user: User,
    new_password: str,
) -> User:

    user.hashed_password = hash_password(
        new_password
    )

    db.commit()
    db.refresh(user)

    return user


def update_user_profile_fields(
    db: Session,
    user: User,
    full_name: str | None,
    email: str | None,
) -> User:

    if full_name is not None:
        user.full_name = full_name.strip()

    if email is not None:
        user.email = normalize_email(email)

    db.commit()
    db.refresh(user)

    return user


def update_notification_preferences(
    db: Session,
    user: User,
    email_enabled: bool | None,
    app_enabled: bool | None,
) -> User:

    if email_enabled is not None:
        user.email_notifications_enabled = (
            email_enabled
        )

    if app_enabled is not None:
        user.app_notifications_enabled = (
            app_enabled
        )

    db.commit()
    db.refresh(user)

    return user


def update_theme(
    db: Session,
    user: User,
    theme: str,
) -> User:

    user.theme = theme

    db.commit()
    db.refresh(user)

    return user


# =========================================================
# ADMIN
# =========================================================

def list_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[User]:

    return (
        db.query(User)
        .order_by(
            User.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


def set_user_active_status(
    db: Session,
    user: User,
    is_active: bool,
) -> User:

    user.is_active = is_active

    db.commit()
    db.refresh(user)

    return user


def delete_user(
    db: Session,
    user: User,
) -> None:

    db.delete(user)
    db.commit()


def get_admin_dashboard_stats(
    db: Session,
) -> dict:

    from datetime import timedelta

    total_users = (
        db.query(func.count(User.id))
        .scalar()
        or 0
    )

    active_users = (
        db.query(func.count(User.id))
        .filter(
            User.is_active.is_(True)
        )
        .scalar()
        or 0
    )

    inactive_users = (
        total_users - active_users
    )

    verified_users = (
        db.query(func.count(User.id))
        .filter(
            User.is_verified.is_(True)
        )
        .scalar()
        or 0
    )

    unverified_users = (
        total_users - verified_users
    )

    admin_users = (
        db.query(func.count(User.id))
        .filter(User.role == "admin")
        .scalar()
        or 0
    )

    pro_users = (
        db.query(func.count(User.id))
        .filter(User.account_tier == "premium", User.role != "admin")
        .scalar()
        or 0
    )

    seven_days_ago = (
        datetime.utcnow()
        - timedelta(days=7)
    )

    new_registrations = (
        db.query(func.count(User.id))
        .filter(
            User.created_at
            >= seven_days_ago
        )
        .scalar()
        or 0
    )

    # Platform activity KPIs used by the Admin dashboard.
    from app.models.activity_log import ActivityLog
    login_events = (
        db.query(func.count(ActivityLog.id))
        .filter(ActivityLog.action == "login")
        .scalar() or 0
    )
    logout_events = (
        db.query(func.count(ActivityLog.id))
        .filter(ActivityLog.action == "logout")
        .scalar() or 0
    )

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "verified_users": verified_users,
        "unverified_users": unverified_users,
        "admin_users": admin_users,
        "pro_users": pro_users,
        "new_registrations_last_7_days": (
            new_registrations
        ),
        "total_login_events": login_events,
        "total_logout_events": logout_events,
    }

def set_user_account_tier(db: Session, user: User, account_tier: str) -> User:
    user.account_tier = account_tier
    db.commit()
    db.refresh(user)
    return user
