from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# -------------------------
# Income Base
# -------------------------
class IncomeBase(BaseModel):
    source: str

    bank_account_id: int

    amount: float = Field(
        ...,
        gt=0,
    )

    description: Optional[str] = None

    date: date


# -------------------------
# Create Income
# -------------------------
class IncomeCreate(IncomeBase):
    pass


# -------------------------
# Update Income
# -------------------------
class IncomeUpdate(BaseModel):
    source: Optional[str] = None

    bank_account_id: Optional[int] = None

    amount: Optional[float] = Field(
        default=None,
        gt=0,
    )

    description: Optional[str] = None

    date: Optional[date] = None


# -------------------------
# Income Response
# -------------------------
class IncomeOut(BaseModel):
    id: int

    user_id: int

    source: str

    bank_account_id: Optional[int] = None

    bank_name: Optional[str] = None

    amount: float

    description: Optional[str] = None

    date: date

    model_config = ConfigDict(
        from_attributes=True
    )