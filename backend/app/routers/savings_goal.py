from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import (
    get_current_active_user,
)

from app.models.user import User

from app.schemas.savings_goal import (
    SavingsGoalCreate,
    SavingsGoalResponse,
    SavingsContributionCreate,
)

from app.crud.savings_goal import (
    create_goal,
    get_goals,
    get_goal,
    update_goal,
    delete_goal,
    contribute_to_goal,
)

from app.crud.activity_log import log_activity

from app.crud.notification import (
    create_notification_for_user_if_enabled,
)


router = APIRouter(
    prefix="/savings-goal",
    tags=["Savings Goal"],
)


# =========================================================
# CREATE
# =========================================================

@router.post(
    "/",
    response_model=SavingsGoalResponse,
)
def add_goal(
    goal: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    try:

        db_goal = create_goal(
            db,
            current_user.id,
            goal,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=409,
            detail=str(exc),
        )

    log_activity(
        db,
        current_user.id,
        "savings_goal_created",
        detail=(
            f"{db_goal.goal_name}: "
            f"target {db_goal.target_amount}"
        ),
    )

    return db_goal


# =========================================================
# GET ALL
# =========================================================

@router.get(
    "/",
    response_model=list[SavingsGoalResponse],
)
def read_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    return get_goals(
        db,
        current_user.id,
    )


# =========================================================
# UPDATE
# =========================================================

@router.put(
    "/{goal_id}",
    response_model=SavingsGoalResponse,
)
def edit_goal(
    goal_id: int,
    goal: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    existing = get_goal(
        db,
        goal_id,
        current_user.id,
    )

    if not existing:

        raise HTTPException(
            status_code=404,
            detail="Savings goal not found.",
        )

    was_complete = (
        float(existing.saved_amount)
        >= float(existing.target_amount)
    )

    try:

        db_goal = update_goal(
            db,
            goal_id,
            current_user.id,
            goal,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=409,
            detail=str(exc),
        )

    if not db_goal:

        raise HTTPException(
            status_code=404,
            detail="Savings goal not found.",
        )

    log_activity(
        db,
        current_user.id,
        "savings_goal_updated",
        detail=f"#{goal_id}",
    )

    now_complete = (
        float(db_goal.saved_amount)
        >= float(db_goal.target_amount)
    )

    if now_complete and not was_complete:

        log_activity(
            db,
            current_user.id,
            "savings_goal_completed",
            detail=db_goal.goal_name,
        )

        create_notification_for_user_if_enabled(
            db,
            current_user,
            title="Savings goal reached! 🎉",
            message=(
                f"You've reached your "
                f"\"{db_goal.goal_name}\" "
                f"savings goal."
            ),
            category="savings_goal",
        )

    return db_goal


# =========================================================
# CONTRIBUTE
# =========================================================

@router.post(
    "/{goal_id}/contribute",
    response_model=SavingsGoalResponse,
)
def contribute(
    goal_id: int,
    payload: SavingsContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    existing = get_goal(
        db,
        goal_id,
        current_user.id,
    )

    if not existing:

        raise HTTPException(
            status_code=404,
            detail="Savings goal not found.",
        )

    was_complete = (
        float(existing.saved_amount)
        >= float(existing.target_amount)
    )

    try:

        db_goal = contribute_to_goal(
            db,
            goal_id,
            current_user.id,
            payload.amount,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    if not db_goal:

        raise HTTPException(
            status_code=404,
            detail="Savings goal not found.",
        )

    log_activity(
        db,
        current_user.id,
        "savings_goal_contribution",
        detail=(
            f"#{goal_id}: "
            f"+{payload.amount}"
        ),
    )

    now_complete = (
        float(db_goal.saved_amount)
        >= float(db_goal.target_amount)
    )

    if now_complete and not was_complete:

        log_activity(
            db,
            current_user.id,
            "savings_goal_completed",
            detail=db_goal.goal_name,
        )

        create_notification_for_user_if_enabled(
            db,
            current_user,
            title="Savings goal reached! 🎉",
            message=(
                f"You've reached your "
                f"\"{db_goal.goal_name}\" "
                f"savings goal."
            ),
            category="savings_goal",
        )

    return db_goal


# =========================================================
# DELETE
# =========================================================

@router.delete(
    "/{goal_id}"
)
def remove_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    db_goal = delete_goal(
        db,
        goal_id,
        current_user.id,
    )

    if not db_goal:

        raise HTTPException(
            status_code=404,
            detail="Savings goal not found.",
        )

    log_activity(
        db,
        current_user.id,
        "savings_goal_deleted",
        detail=f"#{goal_id}",
    )

    return {
        "message":
            "Savings goal deleted successfully"
    }