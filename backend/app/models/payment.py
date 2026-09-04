from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True)
    provider = Column(String(30), default="razorpay", nullable=False)
    provider_order_id = Column(String(100), unique=True, nullable=False, index=True)
    provider_payment_id = Column(String(100), unique=True, nullable=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(String(20), default="pending", nullable=False, index=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="payments")
    subscription = relationship("Subscription", back_populates="payments")
