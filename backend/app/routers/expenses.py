from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User

from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseOut,
    ExpenseSummary,
)

from app.crud.expense import (
    create_expense,
    get_expenses_by_user,
    get_expense,
    update_expense,
    delete_expense,
    get_expense_summary,
)

router = APIRouter()


# -------------------------
# Create Expense
# -------------------------
@router.post("/", response_model=ExpenseOut)
def add_expense(
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_expense(
        db,
        current_user.id,
        expense_in,
    )


# -------------------------
# Get All Expenses
# -------------------------
@router.get("/", response_model=list[ExpenseOut])
def list_expenses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_expenses_by_user(
        db,
        current_user.id,
        skip,
        limit,
    )


# -------------------------
# Expense Summary
# -------------------------
@router.get("/summary", response_model=list[ExpenseSummary])
def expense_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_expense_summary(
        db,
        current_user.id,
    )


# -------------------------
# Get Single Expense
# -------------------------
@router.get("/{expense_id}", response_model=ExpenseOut)
def get_single_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = get_expense(
        db,
        expense_id,
        current_user.id,
    )

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found.",
        )

    return expense


# -------------------------
# Update Expense
# -------------------------
@router.put("/{expense_id}", response_model=ExpenseOut)
def edit_expense(
    expense_id: int,
    expense_in: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = get_expense(
        db,
        expense_id,
        current_user.id,
    )

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found.",
        )

    return update_expense(
        db,
        expense,
        expense_in,
    )


# -------------------------
# Delete Expense
# -------------------------
@router.delete("/{expense_id}")
def remove_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = get_expense(
        db,
        expense_id,
        current_user.id,
    )

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found.",
        )

    delete_expense(
        db,
        expense,
    )

    return {
        "message": "Expense deleted successfully."
    }