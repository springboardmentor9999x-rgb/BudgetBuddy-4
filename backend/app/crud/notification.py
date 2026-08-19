from sqlalchemy.orm import Session

from app.models.notification import Notification


# -------------------------
# Create Notification
# -------------------------
def create_notification(
    db: Session,
    user_id: int,
    message: str,
    notification_type: str,
):
    notification = Notification(
        user_id=user_id,
        message=message,
        type=notification_type,
        is_read=False,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# -------------------------
# Get User Notifications
# -------------------------
def get_notifications_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
):
    return (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# -------------------------
# Get Single Notification
# -------------------------
def get_notification(
    db: Session,
    notification_id: int,
    user_id: int,
):
    return (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        .first()
    )


# -------------------------
# Mark Notification Read
# -------------------------
def mark_notification_as_read(
    db: Session,
    notification: Notification,
):
    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification