from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User

from app.schemas.savings_goal import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalOut,
)

from app.crud.savings_goal import (
    create_savings_goal,
    get_savings_goals_by_user,
    get_savings_goal,
    update_savings_goal,
    contribute_to_goal,
    delete_savings_goal,
)


router = APIRouter()


# -------------------------
# Contribution Schema
# -------------------------

class ContributionRequest(BaseModel):
    amount: float = Field(
        ...,
        gt=0,
    )


# -------------------------
# Create Savings Goal
# -------------------------

@router.post(
    "/",
    response_model=SavingsGoalOut,
)
def add_savings_goal(
    goal_in: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_savings_goal(
        db,
        current_user.id,
        goal_in,
    )


# -------------------------
# Get All Savings Goals
# -------------------------

@router.get(
    "/",
    response_model=list[SavingsGoalOut],
)
def list_savings_goals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_savings_goals_by_user(
        db,
        current_user.id,
        skip,
        limit,
    )


# -------------------------
# Get Single Savings Goal
# -------------------------

@router.get(
    "/{goal_id}",
    response_model=SavingsGoalOut,
)
def get_single_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = get_savings_goal(
        db,
        goal_id,
        current_user.id,
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found.",
        )

    return goal


# -------------------------
# Update Savings Goal
# -------------------------

@router.put(
    "/{goal_id}",
    response_model=SavingsGoalOut,
)
def edit_savings_goal(
    goal_id: int,
    goal_in: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = get_savings_goal(
        db,
        goal_id,
        current_user.id,
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found.",
        )

    return update_savings_goal(
        db,
        goal,
        goal_in,
    )


# -------------------------
# Contribute to Goal
# -------------------------

@router.patch(
    "/{goal_id}/contribute",
    response_model=SavingsGoalOut,
)
def contribute(
    goal_id: int,
    contribution: ContributionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = get_savings_goal(
        db,
        goal_id,
        current_user.id,
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found.",
        )

    return contribute_to_goal(
        db,
        goal,
        contribution.amount,
    )


# -------------------------
# Delete Savings Goal
# -------------------------

@router.delete(
    "/{goal_id}",
)
def remove_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = get_savings_goal(
        db,
        goal_id,
        current_user.id,
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found.",
        )

    delete_savings_goal(
        db,
        goal,
    )

    return {
        "message": "Savings goal deleted successfully."
    }