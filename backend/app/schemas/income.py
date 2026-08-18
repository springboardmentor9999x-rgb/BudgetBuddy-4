from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class IncomeBase(BaseModel):
    source: str
    amount: float = Field(gt=0)
    description: str | None = None
    bank_account: str | None = None

    @field_validator("source")
    @classmethod
    def require_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value


class IncomeCreate(IncomeBase):
    bank_account: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=500)

    @field_validator("description")
    @classmethod
    def require_description(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Description cannot be blank")
        return value


class IncomeUpdate(BaseModel):
    source: str | None = None
    amount: float | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, min_length=1, max_length=500)
    bank_account: str | None = None


class IncomeOut(IncomeBase):
    # Savings-goal contributions are recorded as offsetting income entries.
    # They must be readable even though manually created income is positive-only.
    amount: float
    id: int
    user_id: int
    date: datetime

    class Config:
        from_attributes = True
