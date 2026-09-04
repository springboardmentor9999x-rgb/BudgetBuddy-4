from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.income import Income
from app.core.time import month_bounds

from app.schemas.income import (
    IncomeCreate,
    IncomeUpdate,
    IncomeOut,
)

from app.crud.income import (
    create_income,
    get_all_income,
    get_income_by_id,
    update_income,
    delete_income,
)

router = APIRouter()


# -----------------------------
# Create Income
# -----------------------------
@router.post("/", response_model=IncomeOut)
def add_income(
    income: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_income(db, current_user.id, income)


# -----------------------------
# Get All Income
# -----------------------------
@router.get("/", response_model=list[IncomeOut])
def read_income(
    month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = get_all_income(db, current_user.id)
    if month:
        start, end = month_bounds(month)
        rows = [row for row in rows if row.date and start <= row.date.replace(tzinfo=None) < end]
    return rows[skip:skip + limit]


@router.get("/summary")
def income_summary(
    month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Income.source, func.sum(Income.amount).label("amount")).filter(Income.user_id == current_user.id)
    if month:
        start, end = month_bounds(month)
        query = query.filter(Income.date >= start, Income.date < end)
    rows = query.group_by(Income.source).order_by(func.sum(Income.amount).desc()).all()
    return [{"source": row.source, "amount": float(row.amount)} for row in rows]


# -----------------------------
# Get Income By ID
# -----------------------------
@router.get("/{income_id}", response_model=IncomeOut)
def read_single_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    income = get_income_by_id(
        db,
        income_id,
        current_user.id,
    )

    if not income:
        raise HTTPException(
            status_code=404,
            detail="Income not found",
        )

    return income


# -----------------------------
# Update Income
# -----------------------------
@router.put("/{income_id}", response_model=IncomeOut)
def edit_income(
    income_id: int,
    income: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = update_income(
        db,
        income_id,
        current_user.id,
        income,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Income not found",
        )

    return updated


# -----------------------------
# Delete Income
# -----------------------------
@router.delete("/{income_id}")
def remove_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = delete_income(
        db,
        income_id,
        current_user.id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Income not found",
        )

    return {
        "message": "Income deleted successfully"
    }
