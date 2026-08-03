from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class IncomeBase(BaseModel):
    source: str
    amount: float = Field(..., gt=0)
    description: Optional[str] = None
    date: date


class IncomeCreate(IncomeBase):
    pass


class IncomeUpdate(IncomeBase):
    pass


class IncomeOut(IncomeBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True