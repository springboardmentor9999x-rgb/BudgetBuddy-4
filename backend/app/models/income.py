from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from datetime import datetime

from app.database import Base


class Income(Base):

    __tablename__ = "income"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    source = Column(
        String,
        nullable=False
    )

    category = Column(
        String,
        default="General"
    )

    description = Column(
        String,
        nullable=True
    )

    bank_account_id = Column(
        Integer,
        ForeignKey("bank_accounts.id"),
        nullable=True
    )

    # Free-standing payment method - independent of bank_account_id, since
    # Cash/UPI/Wallet transactions don't require (or have) a linked bank
    # account. Existing rows default to "Bank" so old data stays valid.
    payment_method = Column(
        String,
        nullable=False,
        default="Bank"
    )

    # When the transaction actually happened (user-settable; defaults to
    # "now" if not provided). Distinct from created_at/updated_at, which
    # track record bookkeeping rather than the real-world transaction time.
    transaction_date = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    owner = relationship(
        "User",
        back_populates="income"
    )

    bank_account = relationship(
        "BankAccount"
    )
