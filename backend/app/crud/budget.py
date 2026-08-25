from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.budget import Budget
from app.models.expense import Expense
from app.models.notification import Notification

from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
)


# =========================================================
# Create Budget
# =========================================================
def create_budget(
    db: Session,
    user_id: int,
    budget_in: BudgetCreate,
):
    budget = Budget(
        user_id=user_id,
        **budget_in.model_dump(),
    )

    db.add(budget)
    db.commit()
    db.refresh(budget)

    # =====================================================
    # Budget Created Notification
    # =====================================================

    notification = Notification(
        user_id=user_id,
        message=(
            f"{budget.category} budget of "
            f"₹{budget.limit_amount:,.2f} "
            f"was created successfully."
        ),
        type="budget_added",
        is_read=False,
    )

    db.add(notification)
    db.commit()

    return budget


# =========================================================
# Get All Budgets
# =========================================================
def get_budgets_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
):
    return (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# =========================================================
# Get Single Budget
# =========================================================
def get_budget(
    db: Session,
    budget_id: int,
    user_id: int,
):
    return (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == user_id,
        )
        .first()
    )


# =========================================================
# Update Budget
# =========================================================
def update_budget(
    db: Session,
    budget: Budget,
    budget_in: BudgetUpdate,
):
    update_data = budget_in.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(
            budget,
            key,
            value,
        )

    db.commit()
    db.refresh(budget)

    # =====================================================
    # Budget Updated Notification
    # =====================================================

    notification = Notification(
        user_id=budget.user_id,
        message=(
            f"{budget.category} budget "
            f"was updated successfully."
        ),
        type="budget_updated",
        is_read=False,
    )

    db.add(notification)
    db.commit()

    return budget


# =========================================================
# Delete Budget
# =========================================================
def delete_budget(
    db: Session,
    budget: Budget,
):
    # Save values before deletion
    user_id = budget.user_id
    category = budget.category
    limit_amount = budget.limit_amount

    db.delete(budget)
    db.commit()

    # =====================================================
    # Budget Deleted Notification
    # =====================================================

    notification = Notification(
        user_id=user_id,
        message=(
            f"{category} budget of "
            f"₹{limit_amount:,.2f} "
            f"was deleted."
        ),
        type="budget_deleted",
        is_read=False,
    )

    db.add(notification)
    db.commit()


# =========================================================
# Budget Progress
# =========================================================
def get_budget_progress(
    db: Session,
    user_id: int,
):
    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id
        )
        .all()
    )

    progress = []

    for budget in budgets:

        spent = (
            db.query(
                func.sum(
                    Expense.amount
                )
            )
            .filter(
                Expense.user_id == user_id,
                Expense.category == budget.category,
            )
            .scalar()
            or 0
        )

        remaining = max(
            budget.limit_amount - spent,
            0,
        )

        percentage = (
            (spent / budget.limit_amount) * 100
            if budget.limit_amount > 0
            else 0
        )

        progress.append(
            {
                "category": budget.category,
                "limit": budget.limit_amount,
                "spent": spent,
                "remaining": remaining,
                "percentage": round(
                    percentage,
                    1,
                ),
            }
        )

    return progress