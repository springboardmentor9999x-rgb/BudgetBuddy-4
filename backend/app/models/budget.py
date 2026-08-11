from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)

    category = Column(String, nullable=False)

    amount = Column(Float, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship(
    "User",
    back_populates="budgets"
)