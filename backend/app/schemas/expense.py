from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class ExpenseBase(BaseModel):
    category: str
    payment_method: str
    bank_name: Optional[str] = None
    amount: float = Field(..., gt=0)
    description: Optional[str] = None
    date: date


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(ExpenseBase):
    pass


class ExpenseOut(ExpenseBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class ExpenseSummary(BaseModel):
    category: str
    total: float

    class Config:
        from_attributes = True