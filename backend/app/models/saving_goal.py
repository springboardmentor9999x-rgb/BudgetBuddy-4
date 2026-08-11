from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class SavingGoal(Base):
    __tablename__ = "saving_goals"

    id = Column(Integer, primary_key=True, index=True)

    goal_name = Column(String, nullable=False)

    target_amount = Column(Float, nullable=False)

    saved_amount = Column(Float, default=0)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship(
    "User",
    back_populates="saving_goals"
)