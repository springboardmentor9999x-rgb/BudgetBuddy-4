from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User

from app.schemas.income import (
    IncomeCreate,
    IncomeUpdate,
    IncomeOut,
)

from app.crud.income import (
    create_income,
    get_incomes_by_user,
    get_income,
    update_income,
    delete_income,
)


router = APIRouter()


# -------------------------
# Create Income
# -------------------------
@router.post("/", response_model=IncomeOut)
def add_income(
    income_in: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_income(
        db,
        current_user.id,
        income_in,
    )


# -------------------------
# Get All Income
# -------------------------
@router.get("/", response_model=list[IncomeOut])
def list_income(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_incomes_by_user(
        db,
        current_user.id,
        skip,
        limit,
    )


# -------------------------
# Get Single Income
# -------------------------
@router.get("/{income_id}", response_model=IncomeOut)
def get_single_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    income = get_income(
        db,
        income_id,
        current_user.id,
    )

    if not income:
        raise HTTPException(
            status_code=404,
            detail="Income not found.",
        )

    return income


# -------------------------
# Update Income
# -------------------------
@router.put("/{income_id}", response_model=IncomeOut)
def edit_income(
    income_id: int,
    income_in: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    income = get_income(
        db,
        income_id,
        current_user.id,
    )

    if not income:
        raise HTTPException(
            status_code=404,
            detail="Income not found.",
        )

    return update_income(
        db,
        income,
        income_in,
    )


# -------------------------
# Delete Income
# -------------------------
@router.delete("/{income_id}")
def remove_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    income = get_income(
        db,
        income_id,
        current_user.id,
    )

    if not income:
        raise HTTPException(
            status_code=404,
            detail="Income not found.",
        )

    delete_income(
        db,
        income,
    )

    return {
        "message": "Income deleted successfully."
    }