from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String, nullable=False)

    email = Column(String, unique=True, index=True, nullable=False)

    password = Column(String, nullable=False)  # Store bcrypt hashed password

    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    role = Column(String(20), default="user", nullable=False)

    plan = Column(String(20), default="free", nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # -------------------------
    # Relationships
    # -------------------------

    expenses = relationship(
        "Expense",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
    income = relationship(
    "Income",
    back_populates="user",
    cascade="all, delete-orphan"
)
    profile = relationship(
    "Profile",
    back_populates="user",
    uselist=False,
    cascade="all, delete-orphan"
)
    budgets = relationship(
    "Budget",
    back_populates="user",
    cascade="all, delete-orphan"
)
    saving_goals = relationship(
    "SavingGoal",
    back_populates="user",
    cascade="all, delete-orphan"
)
    notifications = relationship(
    "Notification",
    back_populates="user",
    cascade="all, delete-orphan"
)
    reports = relationship(
    "Report",
    back_populates="user",
    cascade="all, delete-orphan"
    )
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
