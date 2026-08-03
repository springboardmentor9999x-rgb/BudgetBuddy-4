from sqlalchemy.orm import Session

from app.models.income import Income
from app.schemas.income import (
    IncomeCreate,
    IncomeUpdate,
)


# -------------------------
# Create Income
# -------------------------
def create_income(
    db: Session,
    user_id: int,
    income_in: IncomeCreate,
):
    income = Income(
        user_id=user_id,
        **income_in.model_dump()
    )

    db.add(income)
    db.commit()
    db.refresh(income)

    return income


# -------------------------
# Get All Income
# -------------------------
def get_incomes_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
):
    return (
        db.query(Income)
        .filter(Income.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


# -------------------------
# Get Single Income
# -------------------------
def get_income(
    db: Session,
    income_id: int,
    user_id: int,
):
    return (
        db.query(Income)
        .filter(
            Income.id == income_id,
            Income.user_id == user_id,
        )
        .first()
    )


# -------------------------
# Update Income
# -------------------------
def update_income(
    db: Session,
    income: Income,
    income_in: IncomeUpdate,
):
    for key, value in income_in.model_dump().items():
        setattr(income, key, value)

    db.commit()
    db.refresh(income)

    return income


# -------------------------
# Delete Income
# -------------------------
def delete_income(
    db: Session,
    income: Income,
):
    db.delete(income)
    db.commit()