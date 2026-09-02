from datetime import date as Date
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# =========================================================
# Income Base
# =========================================================

class IncomeBase(BaseModel):

    source: str

    bank_account_id: int

    amount: float = Field(
        ...,
        gt=0,
    )

    description: Optional[str] = None

    date: Date


# =========================================================
# Create Income
# =========================================================

class IncomeCreate(IncomeBase):
    pass


# =========================================================
# Update Income
# =========================================================

class IncomeUpdate(BaseModel):

    source: Optional[str] = None

    bank_account_id: Optional[int] = None

    amount: Optional[float] = Field(
        default=None,
        gt=0,
    )

    description: Optional[str] = None

    date: Optional[Date] = None


# =========================================================
# Income Response
# =========================================================

class IncomeOut(BaseModel):

    id: int

    user_id: int

    source: str

    bank_account_id: Optional[int] = None

    bank_name: Optional[str] = None

    amount: float

    description: Optional[str] = None

    date: Date

    model_config = ConfigDict(
        from_attributes=True
    )