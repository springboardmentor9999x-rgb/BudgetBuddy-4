from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.notification import generate_monthly_report_notification, get_notifications, mark_notification_read
from app.database import get_db
from app.models.user import User
from app.schemas.notification import NotificationOut

router = APIRouter()


@router.get("/", response_model=list[NotificationOut])
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_notifications(db, current_user.id)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def read_notification(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = mark_notification_read(db, notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.post("/generate-monthly-report", response_model=NotificationOut)
def generate_monthly_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification, _ = generate_monthly_report_notification(db, current_user.id)
    return notification
