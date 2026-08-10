from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

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
    # Check duplicate bank name
    if income_in.bank_name:
        existing_bank = (
            db.query(Income)
            .filter(
                Income.user_id == user_id,
                func.lower(Income.bank_name)
                == income_in.bank_name.lower(),
            )
            .first()
        )

        if existing_bank:
            raise HTTPException(
                status_code=400,
                detail=f"{income_in.bank_name} bank is already added.",
            )

    income = Income(
        user_id=user_id,
        **income_in.model_dump(),
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
    update_data = income_in.model_dump(
        exclude_unset=True
    )

    # Check duplicate bank name when bank is changed
    new_bank_name = update_data.get("bank_name")

    if new_bank_name:
        existing_bank = (
            db.query(Income)
            .filter(
                Income.user_id == income.user_id,
                Income.id != income.id,
                func.lower(Income.bank_name)
                == new_bank_name.lower(),
            )
            .first()
        )

        if existing_bank:
            raise HTTPException(
                status_code=400,
                detail=f"{new_bank_name} bank is already added.",
            )

    # Update fields
    for key, value in update_data.items():
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