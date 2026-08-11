from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    message = Column(String, nullable=False)

    is_read = Column(Boolean, default=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship(
    "User",
    back_populates="notifications"
)