from datetime import datetime

from pydantic import BaseModel, field_validator, model_validator


# =========================================================
# MONTHLY ALLOCATION - CREATE / UPDATE
# =========================================================

class MonthlyAllocationItem(BaseModel):
    month: int
    allocated_amount: float

    @field_validator("month")
    @classmethod
    def valid_month(cls, value: int) -> int:
        if value < 1 or value > 12:
            raise ValueError("Month must be between 1 and 12.")
        return value

    @field_validator("allocated_amount")
    @classmethod
    def valid_amount(cls, value: float) -> float:
        if value < 0:
            raise ValueError(
                "Monthly budget allocation cannot be negative."
            )
        return value


# =========================================================
# BUDGET CREATE
# =========================================================

class BudgetCreate(BaseModel):
    category: str
    budget_amount: float
    budget_year: int | None = None

    # Optional.
    # If omitted, backend automatically creates 12 monthly allocations.
    monthly_allocations: list[MonthlyAllocationItem] | None = None

    @field_validator("category")
    @classmethod
    def valid_category(cls, value: str) -> str:
        value = " ".join(value.strip().split())

        if not value:
            raise ValueError("Budget category is required.")

        return value

    @field_validator("budget_amount")
    @classmethod
    def valid_budget_amount(cls, value: float) -> float:
        if value <= 0:
            raise ValueError(
                "Budget amount must be greater than 0."
            )

        return value

    @field_validator("budget_year")
    @classmethod
    def reasonable_year(cls, value: int | None) -> int | None:
        if value is not None and (value < 2000 or value > 2100):
            raise ValueError(
                "Please provide a realistic budget year."
            )

        return value

    @model_validator(mode="after")
    def resolve_year(self):
        if self.budget_year is None:
            self.budget_year = datetime.utcnow().year

        return self


# =========================================================
# MONTHLY ALLOCATION RESPONSE
# =========================================================

class MonthlyAllocationResponse(BaseModel):
    month: int
    allocated_amount: float

    class Config:
        from_attributes = True


# =========================================================
# BUDGET RESPONSE
# =========================================================

class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    budget_amount: float
    budget_year: int

    created_at: datetime | None = None
    updated_at: datetime | None = None

    monthly_allocations: list[MonthlyAllocationResponse] = []

    class Config:
        from_attributes = True


# =========================================================
# MONTHLY STATUS RESPONSE
# =========================================================

class MonthlyAllocationStatusResponse(BaseModel):
    month: int
    allocated_amount: float
    spent: float
    remaining: float
    percent_used: float
    is_over_budget: bool


# =========================================================
# COMPLETE BUDGET STATUS
# =========================================================

class BudgetStatusResponse(BaseModel):
    id: int
    category: str
    budget_year: int

    annual_budget: float
    annual_spent: float
    annual_remaining: float
    annual_percent_used: float
    is_over_budget: bool

    monthly: list[MonthlyAllocationStatusResponse]