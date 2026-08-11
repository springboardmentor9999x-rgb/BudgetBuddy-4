from pydantic import BaseModel, Field
from datetime import datetime


class IncomeBase(BaseModel):
    source: str
    amount: float = Field(gt=0)
    description: str | None = None
    bank_account: str | None = None


class IncomeCreate(IncomeBase):
    bank_account: str = Field(min_length=1, max_length=120)


class IncomeUpdate(BaseModel):
    source: str | None = None
    amount: float | None = Field(default=None, gt=0)
    description: str | None = None
    bank_account: str | None = None


class IncomeOut(IncomeBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        from_attributes = True
