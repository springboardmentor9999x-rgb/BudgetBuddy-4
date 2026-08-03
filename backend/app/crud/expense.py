from sqlalchemy.orm import Session

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
    expense = Expense(
        user_id=user_id,
        **expense_in.model_dump()
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
    for key, value in expense_in.model_dump().items():
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