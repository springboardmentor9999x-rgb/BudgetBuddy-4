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


class Income(Base):
    __tablename__ = "incomes"

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
    )

    # -------------------------
    # Income Details
    # -------------------------
    source = Column(
        String(100),
        nullable=False,
    )

    # Keep this temporarily
    # because existing income records use it
    bank_name = Column(
        String(100),
        nullable=False,
    )

    # -------------------------
    # Bank Account
    # -------------------------
    bank_account_id = Column(
        Integer,
        ForeignKey(
            "bank_accounts.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    amount = Column(
        Float,
        nullable=False,
    )

    description = Column(
        String(255),
        nullable=True,
    )

    date = Column(
        Date,
        nullable=False,
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
        back_populates="incomes",
    )

    # -------------------------
    # Bank Account Relationship
    # -------------------------
    bank_account = relationship(
        "BankAccount",
        back_populates="incomes",
    )