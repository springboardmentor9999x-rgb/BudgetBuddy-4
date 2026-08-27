from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ExpenseBase(BaseModel):
    category: str = Field(min_length=1, max_length=80)
    amount: float = Field(gt=0)
    description: Optional[str] = Field(default=None, max_length=500)
    bank_account: Optional[str] = Field(default=None, max_length=120)

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Category cannot be blank")
        return value


class ExpenseCreate(ExpenseBase):
    bank_account: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=500)

    @field_validator("description")
    @classmethod
    def require_description(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Note cannot be blank")
        return value


class ExpenseUpdate(BaseModel):
    category: Optional[str] = Field(default=None, min_length=1, max_length=80)
    amount: Optional[float] = Field(default=None, gt=0)
    description: Optional[str] = Field(default=None, max_length=500)
    bank_account: Optional[str] = Field(default=None, max_length=120)

    @field_validator("category")
    @classmethod
    def normalize_update_category(cls, value: str | None) -> str | None:
        if value is None:
            raise ValueError("Category cannot be null")
        value = value.strip()
        if not value:
            raise ValueError("Category cannot be blank")
        return value


class ExpenseOut(ExpenseBase):
    id: int
    user_id: int
    date: datetime

    model_config = {"from_attributes": True}
