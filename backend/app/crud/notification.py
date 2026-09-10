from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User


def create_notification(
    db: Session, user_id: int, title: str, message: str, category: str = "system"
) -> Notification:
    notification = Notification(
        user_id=user_id, title=title, message=message, category=category
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def create_notification_for_user_if_enabled(
    db: Session, user: User, title: str, message: str, category: str = "system"
) -> Notification | None:
    """Respects the user's in-app notification preference."""
    if not user.app_notifications_enabled:
        return None
    return create_notification(db, user.id, title, message, category)


def broadcast_notification(db: Session, title: str, message: str, category: str = "admin_announcement") -> int:
    """Sends a notification to every active user. Returns the count created."""
    user_ids = [row[0] for row in db.query(User.id).filter(User.is_active.is_(True)).all()]
    for uid in user_ids:
        db.add(Notification(user_id=uid, title=title, message=message, category=category))
    db.commit()
    return len(user_ids)


def get_notifications(db: Session, user_id: int, unread_only: bool = False) -> list[Notification]:
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).all()


def get_unread_count(db: Session, user_id: int) -> int:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .count()
    )


def get_notification(db: Session, notification_id: int, user_id: int) -> Notification | None:
    return (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )


def mark_notification_read(db: Session, notification: Notification) -> Notification:
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_read(db: Session, user_id: int) -> None:
    db.query(Notification).filter(
        Notification.user_id == user_id, Notification.is_read.is_(False)
    ).update({"is_read": True})
    db.commit()


def delete_notification(db: Session, notification: Notification) -> None:
    db.delete(notification)
    db.commit()
