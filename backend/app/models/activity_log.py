from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    # Nullable so genuinely anonymous security events (e.g. an invalid/expired
    # JWT presented before we can identify any user) can still be recorded.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    # e.g. "signup", "login", "login_failed", "logout", "password_changed",
    # "password_reset", "profile_updated", "unauthorized_access_attempt"
    action = Column(String, nullable=False)
    detail = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)

    # "info" | "success" | "warning" | "security"
    severity = Column(String, nullable=False, default="info")

    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="activity_logs")
