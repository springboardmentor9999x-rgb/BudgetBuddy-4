from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.income import Income
from app.models.notification import Notification
from app.core.time import utcnow_naive


def create_notification(db: Session, user_id: int, message: str, notification_type: str):
    notification = Notification(user_id=user_id, message=message, type=notification_type)
    db.add(notification)
    return notification


def get_notifications(db: Session, user_id: int):
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()


def mark_notification_read(db: Session, notification_id: int, user_id: int):
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if not notification:
        return None
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def generate_monthly_report_notification(db: Session, user_id: int):
    """Create one manual monthly-report notification per user and month."""
    now = utcnow_naive()
    month_label = now.strftime("%B %Y")
    existing = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.type == "monthly_report",
        Notification.message.like(f"%{month_label}%"),
    ).first()
    if existing:
        return existing, False

    start = datetime(now.year, now.month, 1)
    end = datetime(start.year + (start.month == 12), (start.month % 12) + 1, 1)
    income = float(db.query(func.coalesce(func.sum(Income.amount), 0)).filter(Income.user_id == user_id, Income.amount > 0, Income.date >= start, Income.date < end).scalar())
    expenses = float(db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(Expense.user_id == user_id, Expense.date >= start, Expense.date < end).scalar())
    notification = create_notification(
        db,
        user_id,
        f"{month_label} summary: income ₹{income:,.2f}, expenses ₹{expenses:,.2f}, balance ₹{income - expenses:,.2f}.",
        "monthly_report",
    )
    db.commit()
    db.refresh(notification)
    return notification, True
