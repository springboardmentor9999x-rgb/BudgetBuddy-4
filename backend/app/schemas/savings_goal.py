from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class SavingsGoalBase(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=150,
    )

    target_amount: float = Field(
        ...,
        gt=0,
    )

    current_amount: float = Field(
        default=0.0,
        ge=0,
    )

    target_date: Optional[date] = None

    status: str = "in_progress"


class SavingsGoalCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=150,
    )

    target_amount: float = Field(
        ...,
        gt=0,
    )

    current_amount: float = Field(
        default=0.0,
        ge=0,
    )

    target_date: Optional[date] = None


class SavingsGoalUpdate(BaseModel):
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    target_amount: Optional[float] = Field(
        default=None,
        gt=0,
    )

    current_amount: Optional[float] = Field(
        default=None,
        ge=0,
    )

    target_date: Optional[date] = None

    status: Optional[str] = None


class SavingsGoalOut(SavingsGoalBase):
    id: int
    user_id: int

    model_config = ConfigDict(
        from_attributes=True
    )