from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetResponse
from app.crud.budget import (
    create_budget,
    get_budgets,
    get_budget,
    update_budget,
    delete_budget,
)

router = APIRouter(
    prefix="/budget",
    tags=["Budget"],
)


@router.post("/", response_model=BudgetResponse)
def add_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return create_budget(db, budget, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/", response_model=list[BudgetResponse])
def read_budget(
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_budgets(db, current_user.id, year=year)


@router.put("/{budget_id}", response_model=BudgetResponse)
def edit_budget(
    budget_id: int,
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db_budget = get_budget(db, budget_id, current_user.id)

    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    try:
        return update_budget(db, db_budget, budget)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{budget_id}")
def remove_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db_budget = get_budget(db, budget_id, current_user.id)

    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    delete_budget(db, db_budget)

    return {"message": "Budget deleted successfully"}
