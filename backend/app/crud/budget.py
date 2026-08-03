from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
)


# -------------------------
# Create Budget
# -------------------------
def create_budget(
    db: Session,
    user_id: int,
    budget_in: BudgetCreate,
):
    budget = Budget(
        user_id=user_id,
        **budget_in.model_dump()
    )

    db.add(budget)
    db.commit()
    db.refresh(budget)

    return budget


# -------------------------
# Get All Budgets
# -------------------------
def get_budgets_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
):
    return (
        db.query(Budget)
        .filter(Budget.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


# -------------------------
# Get Single Budget
# -------------------------
def get_budget(
    db: Session,
    budget_id: int,
    user_id: int,
):
    return (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == user_id,
        )
        .first()
    )


# -------------------------
# Update Budget
# -------------------------
def update_budget(
    db: Session,
    budget: Budget,
    budget_in: BudgetUpdate,
):
    for key, value in budget_in.model_dump().items():
        setattr(budget, key, value)

    db.commit()
    db.refresh(budget)

    return budget


# -------------------------
# Delete Budget
# -------------------------
def delete_budget(
    db: Session,
    budget: Budget,
):
    db.delete(budget)
    db.commit()