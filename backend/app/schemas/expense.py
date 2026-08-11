from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ExpenseBase(BaseModel):
    category: str
    amount: float = Field(gt=0)
    description: Optional[str] = None
    bank_account: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    bank_account: str = Field(min_length=1, max_length=120)


class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)
    description: Optional[str] = None
    bank_account: Optional[str] = None


class ExpenseOut(ExpenseBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        from_attributes = True
