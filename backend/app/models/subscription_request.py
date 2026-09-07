from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


class SubscriptionRequest(Base):

    __tablename__ = "subscription_requests"

    # =========================================================
    # Request ID
    # =========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # =========================================================
    # User ID
    # =========================================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    # =========================================================
    # Subscription Plan
    # =========================================================

    plan = Column(
        String,
        default="premium",
        nullable=False,
    )

    # =========================================================
    # Request Status
    #
    # pending  = waiting for admin approval
    # approved = approved by admin
    # rejected = rejected by admin
    # =========================================================

    status = Column(
        String,
        default="pending",
        nullable=False,
    )

    # =========================================================
    # Created At
    # =========================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # =========================================================
    # Updated At
    # =========================================================

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # =========================================================
    # Relationship With User
    # =========================================================

    user = relationship(
        "User",
        back_populates="subscription_requests",
    )