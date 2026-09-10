from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class IncomeCreate(BaseModel):
    source: str
    amount: float
    category: str = "General"
    description: Optional[str] = None
    bank_account_id: Optional[int] = None
    payment_method: str = "Bank"
    transaction_date: Optional[datetime] = None


class IncomeResponse(BaseModel):
    id: int
    user_id: int
    source: str
    amount: float
    category: str
    description: Optional[str]
    bank_account_id: Optional[int]
    payment_method: str
    transaction_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
