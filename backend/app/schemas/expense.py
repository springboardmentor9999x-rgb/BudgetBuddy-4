from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# -------------------------
# Expense Base
# -------------------------

class ExpenseBase(BaseModel):

    category: str

    payment_method: str

    bank_account_id: Optional[int] = None

    amount: float = Field(
        ...,
        gt=0,
    )

    description: Optional[str] = None

    date: date


# -------------------------
# Create Expense
# -------------------------

class ExpenseCreate(ExpenseBase):
    pass


# -------------------------
# Update Expense
# -------------------------

class ExpenseUpdate(BaseModel):

    category: Optional[str] = None

    payment_method: Optional[str] = None

    bank_account_id: Optional[int] = None

    amount: Optional[float] = Field(
        default=None,
        gt=0,
    )

    description: Optional[str] = None

    date: Optional[date] = None


# -------------------------
# Expense Response
# -------------------------

class ExpenseOut(ExpenseBase):

    id: int

    user_id: int

    bank_name: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True
    )


# -------------------------
# Expense Summary
# -------------------------

class ExpenseSummary(BaseModel):

    category: str

    total: float