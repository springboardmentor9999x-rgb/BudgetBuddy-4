from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    category: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UnreadCountResponse(BaseModel):
    unread_count: int


class AdminAnnouncementCreate(BaseModel):
    title: str
    message: str
    # If None, the announcement is broadcast to all users.
    target_user_id: int | None = None
