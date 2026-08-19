from pydantic import BaseModel, Field, ConfigDict


class BudgetBase(BaseModel):
    category: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    limit_amount: float = Field(
        ...,
        gt=0,
    )


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BudgetBase):
    pass


class BudgetOut(BudgetBase):
    id: int
    user_id: int

    model_config = ConfigDict(
        from_attributes=True
    )