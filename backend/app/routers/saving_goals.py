from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.saving_goal import contribute_to_goal, create_goal, delete_goal, get_goal, get_goals, update_goal
from app.database import get_db
from app.models.user import User
from app.schemas.saving_goal import ContributionCreate, SavingGoalCreate, SavingGoalProgress, SavingGoalUpdate

router = APIRouter()


@router.post("/", response_model=SavingGoalProgress, status_code=status.HTTP_201_CREATED)
def add_goal(goal_in: SavingGoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_goal(db, current_user.id, goal_in)


@router.get("/", response_model=list[SavingGoalProgress])
def list_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_goals(db, current_user.id)


@router.get("/{goal_id}", response_model=SavingGoalProgress)
def read_goal(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = get_goal(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    from app.crud.saving_goal import _progress
    return _progress(goal)


@router.put("/{goal_id}", response_model=SavingGoalProgress)
def edit_goal(goal_id: int, goal_in: SavingGoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = update_goal(db, goal_id, current_user.id, goal_in)
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return goal


@router.patch("/{goal_id}/contribute", response_model=SavingGoalProgress)
def contribute(goal_id: int, contribution: ContributionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = contribute_to_goal(db, goal_id, current_user.id, contribution)
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return goal


@router.delete("/{goal_id}")
def remove_goal(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not delete_goal(db, goal_id, current_user.id):
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return {"message": "Savings goal deleted successfully"}
