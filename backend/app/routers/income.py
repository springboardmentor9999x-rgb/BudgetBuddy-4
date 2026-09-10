from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User

from app.schemas.income import (
    IncomeCreate,
    IncomeResponse
)

from app.crud.income import (
    create_income,
    get_income,
    get_income_by_id,
    update_income,
    delete_income,
)

from app.crud.activity_log import log_activity
from app.core.validation import DuplicateRecordError
from app.crud.notification import (
    create_notification_for_user_if_enabled
)


router = APIRouter(
    prefix="/income",
    tags=["Income"]
)


# =========================================================
# ADD INCOME
# =========================================================

@router.post(
    "/",
    response_model=IncomeResponse
)
def add_income(
    income: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    try:

        db_income = create_income(
            db,
            current_user.id,
            income
        )

    except DuplicateRecordError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # -----------------------------------------------------
    # Activity log
    # -----------------------------------------------------

    log_activity(
        db,
        current_user.id,
        "income_added",
        detail=(
            f"{income.source}: "
            f"{income.amount}"
        )
    )

    # -----------------------------------------------------
    # Notification
    # -----------------------------------------------------

    create_notification_for_user_if_enabled(
        db,
        current_user,
        title="Income added",
        message=(
            f"{income.source} income of "
            f"{income.amount} was recorded."
        ),
        category="income",
    )

    return db_income


# =========================================================
# GET ALL INCOME
# =========================================================

@router.get(
    "/",
    response_model=list[IncomeResponse]
)
def read_income(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    return get_income(
        db,
        current_user.id
    )


# =========================================================
# UPDATE INCOME
# =========================================================

@router.put(
    "/{income_id}",
    response_model=IncomeResponse
)
def edit_income(
    income_id: int,
    income: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    db_income = get_income_by_id(
        db,
        income_id,
        current_user.id
    )

    if not db_income:

        raise HTTPException(
            status_code=404,
            detail="Income not found"
        )

    try:

        updated = update_income(
            db,
            db_income,
            income
        )

    except DuplicateRecordError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # -----------------------------------------------------
    # Activity log
    # -----------------------------------------------------

    log_activity(
        db,
        current_user.id,
        "income_updated",
        detail=f"#{income_id}"
    )

    return updated


# =========================================================
# DELETE INCOME
# =========================================================

@router.delete(
    "/{income_id}"
)
def remove_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    db_income = get_income_by_id(
        db,
        income_id,
        current_user.id
    )

    if not db_income:

        raise HTTPException(
            status_code=404,
            detail="Income not found"
        )

    delete_income(
        db,
        db_income
    )

    # -----------------------------------------------------
    # Activity log
    # -----------------------------------------------------

    log_activity(
        db,
        current_user.id,
        "income_deleted",
        detail=f"#{income_id}"
    )

    return {
        "message": "Income deleted successfully"
    }