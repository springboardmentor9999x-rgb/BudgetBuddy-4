from datetime import datetime

from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.database import Base


class Budget(Base):
    __tablename__ = "budget"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    category = Column(String, nullable=False)

    # Annual budget for this category/year. Kept as "budget_amount" (rather
    # than renaming) so the existing budget-alert code and any already-issued
    # API responses keep working without a breaking field rename.
    budget_amount = Column(Float, nullable=False)

    budget_year = Column(Integer, nullable=False, default=lambda: datetime.utcnow().year, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship(
        "User",
        back_populates="budgets"
    )

    monthly_allocations = relationship(
        "BudgetMonthlyAllocation",
        back_populates="budget",
        cascade="all, delete-orphan",
        order_by="BudgetMonthlyAllocation.month",
    )


class BudgetMonthlyAllocation(Base):
    __tablename__ = "budget_monthly_allocations"

    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budget.id"), nullable=False, index=True)

    month = Column(Integer, nullable=False)  # 1-12
    allocated_amount = Column(Float, nullable=False, default=0.0)

    budget = relationship("Budget", back_populates="monthly_allocations")
