from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.models.income import Income

from app.schemas.notification import NotificationOut

from app.crud.notification import (
    get_notifications_by_user,
    get_notification,
    mark_notification_as_read,
    create_notification,
)


router = APIRouter()


# -------------------------
# Get Notifications
# -------------------------
@router.get(
    "/",
    response_model=list[NotificationOut],
)
def list_notifications(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_notifications_by_user(
        db,
        current_user.id,
        skip,
        limit,
    )


# -------------------------
# Mark Notification as Read
# -------------------------
@router.patch(
    "/{notification_id}/read",
    response_model=NotificationOut,
)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = get_notification(
        db,
        notification_id,
        current_user.id,
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    return mark_notification_as_read(
        db,
        notification,
    )


# -------------------------
# Generate Monthly Report
# -------------------------
@router.post(
    "/generate-monthly-report",
    response_model=NotificationOut,
)
def generate_monthly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()

    year = today.year
    month = today.month

    # -------------------------
    # Total Income
    # -------------------------
    total_income = (
        db.query(
            func.sum(Income.amount)
        )
        .filter(
            Income.user_id == current_user.id,
            func.extract(
                "year",
                Income.date,
            ) == year,
            func.extract(
                "month",
                Income.date,
            ) == month,
        )
        .scalar()
        or 0
    )

    # -------------------------
    # Total Expenses
    # -------------------------
    total_expenses = (
        db.query(
            func.sum(Expense.amount)
        )
        .filter(
            Expense.user_id == current_user.id,
            func.extract(
                "year",
                Expense.date,
            ) == year,
            func.extract(
                "month",
                Expense.date,
            ) == month,
        )
        .scalar()
        or 0
    )

    # -------------------------
    # Calculate Savings
    # -------------------------
    savings = total_income - total_expenses

    if total_income > 0:
        savings_rate = (
            savings / total_income
        ) * 100
    else:
        savings_rate = 0

    message = (
        f"Your {today.strftime('%B %Y')} "
        f"monthly report: "
        f"Income ₹{total_income:.2f}, "
        f"Expenses ₹{total_expenses:.2f}, "
        f"Savings ₹{savings:.2f}, "
        f"Savings rate {savings_rate:.1f}%."
    )

    notification = create_notification(
        db=db,
        user_id=current_user.id,
        message=message,
        notification_type="monthly_report",
    )

    return notification