from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.core.time import month_bounds

from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseOut,
)

from app.crud.expense import (
    create_expense,
    get_all_expenses,
    get_expense_by_id,
    update_expense,
    delete_expense,
)

router = APIRouter()


# -----------------------------
# Create Expense
# -----------------------------
@router.post("/", response_model=ExpenseOut)
def add_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_expense(db, current_user.id, expense)


# -----------------------------
# Get All Expenses
# -----------------------------
@router.get("/", response_model=list[ExpenseOut])
def read_expenses(
    month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session =Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = get_all_expenses(db, current_user.id)
    if month:
        start, end = month_bounds(month)
        rows = [row for row in rows if row.date and start <= row.date.replace(tzinfo=None) < end]
    return rows[skip:skip + limit]


@router.get("/summary")
def expense_summary(
    month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Expense.category, func.sum(Expense.amount).label("amount")).filter(Expense.user_id == current_user.id)
    if month:
        start, end = month_bounds(month)
        query = query.filter(Expense.date >= start, Expense.date < end)
    rows = query.group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all()
    return [{"category": row.category, "amount": float(row.amount)} for row in rows]


# -----------------------------
# Get Expense By ID
# -----------------------------
@router.get("/{expense_id}", response_model=ExpenseOut)
def read_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = get_expense_by_id(
        db,
        expense_id,
        current_user.id,
    )

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    return expense


# -----------------------------
# Update Expense
# -----------------------------
@router.put("/{expense_id}", response_model=ExpenseOut)
def edit_expense(
    expense_id: int,
    expense: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = update_expense(
        db,
        expense_id,
        current_user.id,
        expense,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    return updated


# -----------------------------
# Delete Expense
# -----------------------------
@router.delete("/{expense_id}")
def remove_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = delete_expense(
        db,
        expense_id,
        current_user.id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    return {
        "message": "Expense deleted successfully"
    }
