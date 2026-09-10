from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User

from app.schemas.expense import (
    ExpenseCreate,
    ExpenseResponse
)

from app.crud.expense import (
    create_expense,
    get_expenses,
    get_expense,
    update_expense,
    delete_expense,
)

from app.crud.budget import (
    evaluate_and_notify_budget_status
)

from app.crud.activity_log import (
    log_activity
)
from app.core.validation import DuplicateRecordError


router = APIRouter(
    prefix="/expense",
    tags=["Expense"]
)


# =========================================================
# ADD EXPENSE
# =========================================================

@router.post(
    "/",
    response_model=ExpenseResponse
)
def add_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):
    try:

        db_expense = create_expense(
            db,
            current_user.id,
            expense
        )

    except DuplicateRecordError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_activity(
        db,
        current_user.id,
        "expense_added",
        detail=(
            f"{expense.category}: "
            f"{expense.amount}"
        )
    )

    evaluate_and_notify_budget_status(
        db,
        current_user,
        expense.category
    )

    return db_expense


# =========================================================
# GET EXPENSES
# =========================================================

@router.get(
    "/",
    response_model=list[ExpenseResponse]
)
def read_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    return get_expenses(
        db,
        current_user.id
    )


# =========================================================
# UPDATE EXPENSE
# =========================================================

@router.put(
    "/{expense_id}",
    response_model=ExpenseResponse
)
def edit_expense(
    expense_id: int,
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    db_expense = get_expense(
        db,
        expense_id,
        current_user.id
    )

    if not db_expense:

        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    try:

        updated = update_expense(
            db,
            db_expense,
            expense
        )

    except DuplicateRecordError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_activity(
        db,
        current_user.id,
        "expense_updated",
        detail=f"#{expense_id}"
    )

    evaluate_and_notify_budget_status(
        db,
        current_user,
        expense.category
    )

    return updated


# =========================================================
# DELETE EXPENSE
# =========================================================

@router.delete(
    "/{expense_id}"
)
def remove_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    db_expense = get_expense(
        db,
        expense_id,
        current_user.id
    )

    if not db_expense:

        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    delete_expense(
        db,
        db_expense
    )

    log_activity(
        db,
        current_user.id,
        "expense_deleted",
        detail=f"#{expense_id}"
    )

    return {
        "message": "Expense deleted successfully"
    }