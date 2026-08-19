from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password = Column(
        String,
        nullable=False,
    )

    role = Column(
        String,
        default="student",
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    # -------------------------
    # Email Verification
    # -------------------------
    is_email_verified = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    verification_code = Column(
        String(6),
        nullable=True,
    )

    verification_code_expires_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # -------------------------
    # One-to-One Relationship
    # -------------------------
    profile = relationship(
        "Profile",
        back_populates="owner",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # -------------------------
    # One-to-Many Relationships
    # -------------------------
    incomes = relationship(
        "Income",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    expenses = relationship(
        "Expense",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    budgets = relationship(
        "Budget",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # -------------------------
    # Bank Accounts
    # -------------------------
    bank_accounts = relationship(
        "BankAccount",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # -------------------------
    # Savings Goals
    # -------------------------
    savings_goals = relationship(
        "SavingsGoal",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # -------------------------
    # Notifications
    # -------------------------
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )