from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Date,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    title = Column(
        String(150),
        nullable=False,
    )

    target_amount = Column(
        Float,
        nullable=False,
    )

    current_amount = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    target_date = Column(
        Date,
        nullable=True,
    )

    status = Column(
        String(30),
        nullable=False,
        default="in_progress",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # Relationship with User
    user = relationship(
        "User",
        back_populates="savings_goals",
    )