from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.expense import Expense
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
)


# -------------------------
# Create Expense
# -------------------------
def create_expense(
    db: Session,
    user_id: int,
    expense_in: ExpenseCreate,
):
    # Check duplicate bank name
    if expense_in.bank_name:
        existing_bank = (
            db.query(Expense)
            .filter(
                Expense.user_id == user_id,
                func.lower(Expense.bank_name)
                == expense_in.bank_name.lower(),
            )
            .first()
        )

        if existing_bank:
            raise HTTPException(
                status_code=400,
                detail=f"{expense_in.bank_name} bank is already added.",
            )

    expense = Expense(
        user_id=user_id,
        **expense_in.model_dump(),
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


# -------------------------
# Get All Expenses
# -------------------------
def get_expenses_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
):
    return (
        db.query(Expense)
        .filter(Expense.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


# -------------------------
# Get Single Expense
# -------------------------
def get_expense(
    db: Session,
    expense_id: int,
    user_id: int,
):
    return (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        )
        .first()
    )


# -------------------------
# Update Expense
# -------------------------
def update_expense(
    db: Session,
    expense: Expense,
    expense_in: ExpenseUpdate,
):
    update_data = expense_in.model_dump(
        exclude_unset=True
    )

    # Check duplicate bank name when bank is changed
    new_bank_name = update_data.get("bank_name")

    if new_bank_name:
        existing_bank = (
            db.query(Expense)
            .filter(
                Expense.user_id == expense.user_id,
                Expense.id != expense.id,
                func.lower(Expense.bank_name)
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
        setattr(expense, key, value)

    db.commit()
    db.refresh(expense)

    return expense


# -------------------------
# Delete Expense
# -------------------------
def delete_expense(
    db: Session,
    expense: Expense,
):
    db.delete(expense)
    db.commit()


# -------------------------
# Expense Summary
# -------------------------
def get_expense_summary(
    db: Session,
    user_id: int,
):
    return (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
        )
        .filter(Expense.user_id == user_id)
        .group_by(Expense.category)
        .all()
    )