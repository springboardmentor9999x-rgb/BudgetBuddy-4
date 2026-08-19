from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.budget import create_budget, delete_budget, get_budget, get_budget_summary, get_budgets, update_budget
from app.database import get_db
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetOut, BudgetSummary, BudgetUpdate
from app.core.time import utcnow_naive

router = APIRouter()


@router.post("/", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def add_budget(budget_in: BudgetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_budget(db, current_user.id, budget_in)


@router.get("/", response_model=list[BudgetOut])
def list_budgets(month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_budgets(db, current_user.id, month)


@router.get("/summary", response_model=list[BudgetSummary])
def budget_summary(month: str = Query(default_factory=lambda: utcnow_naive().strftime("%Y-%m"), pattern=r"^\d{4}-(0[1-9]|1[0-2])$"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_budget_summary(db, current_user.id, month)


@router.get("/{budget_id}", response_model=BudgetOut)
def read_budget(budget_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budget = get_budget(db, budget_id, current_user.id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


@router.put("/{budget_id}", response_model=BudgetOut)
def edit_budget(budget_id: int, budget_in: BudgetUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budget = update_budget(db, budget_id, current_user.id, budget_in)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


@router.delete("/{budget_id}")
def remove_budget(budget_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not delete_budget(db, budget_id, current_user.id):
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted successfully"}
