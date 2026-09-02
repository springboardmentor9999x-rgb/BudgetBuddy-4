from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class User(Base):
    __tablename__ = "users"

    # =========================================================
    # Basic User Information
    # =========================================================

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

    # =========================================================
    # User Role
    # =========================================================
    # New users:
    # student
    #
    # After admin approval:
    # premium
    #
    # Administrator:
    # admin
    # =========================================================

    role = Column(
        String,
        default="student",
        nullable=False,
    )

    # =========================================================
    # Account Status
    # =========================================================

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    # =========================================================
    # Email Verification
    # =========================================================

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

    # =========================================================
    # Account Creation
    # =========================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # =========================================================
    # One-to-One Relationship
    # =========================================================

    profile = relationship(
        "Profile",
        back_populates="owner",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # =========================================================
    # Income
    # =========================================================

    incomes = relationship(
        "Income",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # =========================================================
    # Expenses
    # =========================================================

    expenses = relationship(
        "Expense",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # =========================================================
    # Budgets
    # =========================================================

    budgets = relationship(
        "Budget",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # =========================================================
    # Bank Accounts
    # =========================================================

    bank_accounts = relationship(
        "BankAccount",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # =========================================================
    # Savings Goals
    # =========================================================

    savings_goals = relationship(
        "SavingsGoal",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # =========================================================
    # Notifications
    # =========================================================

    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # =========================================================
    # Subscription Requests
    # =========================================================
    #
    # Student requests Premium
    #          ↓
    # SubscriptionRequest created
    #          ↓
    # Admin approves/rejects
    #          ↓
    # If approved → User.role = "premium"
    #
    # =========================================================

    subscription_requests = relationship(
        "SubscriptionRequest",
        back_populates="user",
        cascade="all, delete-orphan",
    )