from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime
)

from sqlalchemy.orm import relationship

from app.database import Base


class BankAccount(Base):

    __tablename__ = "bank_accounts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    bank_name = Column(
        String,
        nullable=False
    )

    account_holder_name = Column(
        String,
        nullable=True
    )

    account_number = Column(
        String,
        nullable=False
    )

    ifsc_code = Column(
        String,
        nullable=True
    )

    account_type = Column(
        String,
        default="Savings"
    )

    opening_balance = Column(
        Float,
        default=0.0,
        nullable=False
    )

    balance = Column(
        Float,
        default=0.0,
        nullable=False
    )

    status = Column(
        String,
        default="active",
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
        back_populates="bank_accounts"
    )