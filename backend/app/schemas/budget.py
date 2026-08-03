from pydantic import BaseModel, Field


class BudgetBase(BaseModel):
    category: str
    limit_amount: float = Field(..., gt=0)


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BudgetBase):
    pass


class BudgetOut(BudgetBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True