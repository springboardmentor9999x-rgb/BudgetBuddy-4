from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class BankAccount(Base):
    __tablename__ = "bank_accounts"

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

    # -------------------------
    # Bank Details
    # -------------------------
    bank_name = Column(
        String(100),
        nullable=False,
    )

    account_number = Column(
        String(30),
        nullable=False,
    )

    account_type = Column(
        String(30),
        nullable=False,
        default="Savings",
    )

    opening_balance = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # -------------------------
    # User Relationship
    # -------------------------
    user = relationship(
        "User",
        back_populates="bank_accounts",
    )

    # -------------------------
    # Income Relationship
    # -------------------------
    incomes = relationship(
        "Income",
        back_populates="bank_account",
    )

    # -------------------------
    # Expense Relationship
    # -------------------------
    expenses = relationship(
        "Expense",
        back_populates="bank_account",
    )

    # -------------------------
    # Prevent Duplicate Banks
    # -------------------------
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "bank_name",
            name="uq_user_bank_name",
        ),
    )