from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.database import Base


class PremiumRequest(Base):
    """
    Manual "Normal -> Premium" upgrade request submitted by a user and
    reviewed by an Admin. Approving a request sets account_tier to
    "premium" directly on the user's existing account - no separate
    payment/checkout flow is involved.
    """

    __tablename__ = "premium_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # pending | approved | rejected
    status = Column(String, nullable=False, default="pending", index=True)

    note = Column(Text, nullable=True)

    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
