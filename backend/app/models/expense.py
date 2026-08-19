from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.time import utcnow_naive

from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    category = Column(String, nullable=False)

    amount = Column(Float, nullable=False)

    description = Column(String, nullable=True)

    # Stores a display-safe label, for example "HDFC Bank •••• 1234".
    bank_account = Column(String, nullable=True)

    date = Column(DateTime, default=utcnow_naive)

    owner = relationship("User", back_populates="expenses")
