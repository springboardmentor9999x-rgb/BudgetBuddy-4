from datetime import datetime

from pydantic import (
    BaseModel,
    computed_field,
    field_validator,
)


# =========================================================
# CREATE / UPDATE
# =========================================================

class SavingsGoalCreate(BaseModel):

    goal_name: str

    target_amount: float

    saved_amount: float = 0.0

    @field_validator("goal_name")
    @classmethod
    def validate_name(
        cls,
        value: str,
    ) -> str:

        value = " ".join(
            value.strip().split()
        )

        if not value:
            raise ValueError(
                "Savings goal name is required."
            )

        return value

    @field_validator("target_amount")
    @classmethod
    def validate_target(
        cls,
        value: float,
    ) -> float:

        if value <= 0:
            raise ValueError(
                "Target amount must be greater than 0."
            )

        return value

    @field_validator("saved_amount")
    @classmethod
    def validate_saved(
        cls,
        value: float,
    ) -> float:

        if value < 0:
            raise ValueError(
                "Saved amount cannot be negative."
            )

        return value


# =========================================================
# CONTRIBUTION
# =========================================================

class SavingsContributionCreate(BaseModel):

    amount: float

    @field_validator("amount")
    @classmethod
    def validate_amount(
        cls,
        value: float,
    ) -> float:

        if value <= 0:
            raise ValueError(
                "Contribution amount must be greater than 0."
            )

        return value


# =========================================================
# RESPONSE
# =========================================================

class SavingsGoalResponse(BaseModel):

    id: int

    user_id: int

    goal_name: str

    target_amount: float

    saved_amount: float

    created_at: datetime | None = None

    updated_at: datetime | None = None

    @computed_field
    @property
    def monthly_allocation(self) -> float:
        """
        Automatic 12-month savings allocation.

        Example:
            Target = ₹60,000
            Monthly allocation = ₹5,000
        """

        return round(
            float(self.target_amount) / 12.0,
            2,
        )

    @computed_field
    @property
    def progress_percent(self) -> float:

        target = float(
            self.target_amount or 0
        )

        saved = float(
            self.saved_amount or 0
        )

        if target <= 0:
            return 0.0

        return round(
            min(
                (saved / target) * 100,
                100,
            ),
            2,
        )

    class Config:
        from_attributes = True