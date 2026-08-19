from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base
from app.core.time import utcnow_naive


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)

    category = Column(String, nullable=False)

    amount = Column(Float, nullable=False)

    # Stored as YYYY-MM so a user can maintain a separate limit each month.
    month = Column(String(7), nullable=False, default=lambda: utcnow_naive().strftime("%Y-%m"))

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship(
    "User",
    back_populates="budgets"
)
