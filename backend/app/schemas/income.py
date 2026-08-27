from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class IncomeBase(BaseModel):
    source: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0)
    description: str | None = Field(default=None, max_length=500)
    bank_account: str | None = Field(default=None, max_length=120)

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
    source: str | None = Field(default=None, min_length=1, max_length=100)
    amount: float | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, min_length=1, max_length=500)
    bank_account: str | None = Field(default=None, max_length=120)

    @field_validator("source")
    @classmethod
    def normalize_update_source(cls, value: str | None) -> str | None:
        if value is None:
            raise ValueError("Source cannot be null")
        value = value.strip()
        if value == "":
            raise ValueError("Source cannot be blank")
        return value


class IncomeOut(IncomeBase):
    # Savings-goal contributions are recorded as offsetting income entries.
    # They must be readable even though manually created income is positive-only.
    amount: float
    id: int
    user_id: int
    date: datetime

    model_config = {"from_attributes": True}
