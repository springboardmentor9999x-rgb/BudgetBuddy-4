from app.core.time import utcnow_naive
import re

from pydantic import BaseModel, Field, field_validator


class BudgetBase(BaseModel):
    category: str = Field(min_length=1, max_length=80)
    amount: float = Field(gt=0)
    month: str = Field(default_factory=lambda: utcnow_naive().strftime("%Y-%m"))

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Category cannot be blank")
        return value

    @field_validator("month")
    @classmethod
    def validate_month(cls, value: str) -> str:
        if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", value):
            raise ValueError("Month must use YYYY-MM format")
        return value


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=80)
    amount: float | None = Field(default=None, gt=0)
    month: str | None = None

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else value

    @field_validator("month")
    @classmethod
    def validate_month(cls, value: str | None) -> str | None:
        if value is not None and not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", value):
            raise ValueError("Month must use YYYY-MM format")
        return value


class BudgetOut(BudgetBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}


class BudgetSummary(BudgetOut):
    spent: float
    remaining: float
    utilization: float
