from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator


class SavingGoalBase(BaseModel):
    goal_name: str = Field(min_length=1, max_length=100)
    target_amount: float = Field(gt=0)
    target_date: date | None = None

    @field_validator("goal_name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Goal name cannot be blank")
        return value


class SavingGoalCreate(SavingGoalBase):
    saved_amount: float = Field(default=0, ge=0)


class SavingGoalUpdate(BaseModel):
    goal_name: str | None = Field(default=None, min_length=1, max_length=100)
    target_amount: float | None = Field(default=None, gt=0)
    target_date: date | None = None

    @field_validator("goal_name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            raise ValueError("Goal name cannot be null")
        value = value.strip()
        if not value:
            raise ValueError("Goal name cannot be blank")
        return value


class ContributionCreate(BaseModel):
    amount: float = Field(gt=0)


class SavingGoalOut(SavingGoalBase):
    id: int
    user_id: int
    saved_amount: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SavingGoalProgress(SavingGoalOut):
    progress_percentage: float
    remaining_amount: float
