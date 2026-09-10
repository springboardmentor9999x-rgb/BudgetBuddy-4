from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    full_name = Column(
        String,
        nullable=True,
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    phone_number = Column(
        String,
        nullable=True,
    )

    hashed_password = Column(
        String,
        nullable=False,
    )

    # =========================================================
    # AUTH / ACCOUNT STATUS
    # =========================================================

    is_verified = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    role = Column(
        String,
        default="user",
        nullable=False,
    )  # "user" | "admin"

    account_tier = Column(
        String,
        default="normal",
        nullable=False,
    )  # "normal" | "premium"

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    last_login_at = Column(
        DateTime,
        nullable=True,
    )

    # =========================================================
    # NOTIFICATION PREFERENCES
    # =========================================================

    email_notifications_enabled = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    app_notifications_enabled = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    # =========================================================
    # APPEARANCE / SETTINGS
    # =========================================================

    theme = Column(
        String,
        default="light",
        nullable=False,
    )  # "light" | "dark"

        # =========================================================
    # RELATIONSHIPS
    # =========================================================

    income = relationship(
        "Income",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    expense = relationship(
        "Expense",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    budgets = relationship(
        "Budget",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    bank_accounts = relationship(
        "BankAccount",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    profile = relationship(
        "Profile",
        back_populates="owner",
        uselist=False,
        cascade="all, delete-orphan",
    )

    notifications = relationship(
        "Notification",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    activity_logs = relationship(
        "ActivityLog",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    savings_goals = relationship(
        "SavingsGoal",
        back_populates="owner",
        cascade="all, delete-orphan",
    )