from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Income(Base):
    __tablename__ = "income"

    id = Column(Integer, primary_key=True, index=True)

    source = Column(String, nullable=False)

    amount = Column(Float, nullable=False)

    description = Column(String, nullable=True)

    bank_account = Column(String, nullable=True)

    date = Column(DateTime(timezone=True), server_default=func.now())

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="income")
