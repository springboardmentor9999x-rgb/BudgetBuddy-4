from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.savings_goal import SavingsGoal
from app.models.notification import Notification
from app.models.income import Income
from app.models.expense import Expense

from app.schemas.savings_goal import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
)


# =========================================================
# Get Available Balance
# =========================================================
#
# Savings contributions are stored as Expense records.
# Therefore:
#
# Available Balance =
# Total Income - Total Expenses
#
# We DO NOT subtract SavingsGoal.current_amount here,
# because that would deduct the same savings money twice.
# =========================================================

def get_available_balance(
    db: Session,
    user_id: int,
):
    total_income = (
        db.query(
            func.coalesce(
                func.sum(Income.amount),
                0,
            )
        )
        .filter(
            Income.user_id == user_id
        )
        .scalar()
    )

    total_expenses = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0,
            )
        )
        .filter(
            Expense.user_id == user_id
        )
        .scalar()
    )

    available_balance = (
        float(total_income)
        - float(total_expenses)
    )

    return max(
        available_balance,
        0,
    )


# =========================================================
# Create Savings Goal
# =========================================================

def create_savings_goal(
    db: Session,
    user_id: int,
    goal_in: SavingsGoalCreate,
):

    # -------------------------
    # Validate Target
    # -------------------------

    if goal_in.target_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Target amount must be "
                "greater than zero."
            ),
        )


    # -------------------------
    # Validate Current Amount
    # -------------------------

    if goal_in.current_amount < 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Current amount cannot "
                "be negative."
            ),
        )


    if (
        goal_in.current_amount
        > goal_in.target_amount
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Current amount cannot "
                "exceed target amount."
            ),
        )


    # -------------------------
    # Check Available Balance
    # -------------------------

    available_balance = (
        get_available_balance(
            db,
            user_id,
        )
    )


    if (
        goal_in.current_amount
        > available_balance
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Insufficient available "
                "balance. "
                f"Available balance is "
                f"₹{available_balance:.2f}."
            ),
        )


    # -------------------------
    # Determine Status
    # -------------------------

    status = (
        "completed"
        if (
            goal_in.current_amount
            >= goal_in.target_amount
        )
        else "in_progress"
    )


    # -------------------------
    # Create Goal
    # -------------------------

    goal = SavingsGoal(
        user_id=user_id,
        title=goal_in.title.strip(),
        target_amount=goal_in.target_amount,
        current_amount=goal_in.current_amount,
        target_date=goal_in.target_date,
        status=status,
    )

    db.add(goal)

    db.flush()


    # =====================================================
    # Initial Savings
    # =====================================================
    #
    # If user creates a goal with initial_amount > 0,
    # create an expense transaction so the money is
    # actually deducted from available balance.
    # =====================================================

    if goal_in.current_amount > 0:

        savings_expense = Expense(
            user_id=user_id,

            category="Savings",

            amount=goal_in.current_amount,

            payment_method="Savings Goal",

            bank_name="Savings Goal",

            bank_account_id=None,

            description=(
                f"Initial savings for "
                f"'{goal.title}'"
            ),

            date=date.today(),
        )

        db.add(
            savings_expense
        )


    # -------------------------
    # Commit
    # -------------------------

    db.commit()

    db.refresh(goal)

    return goal


# =========================================================
# Get All Savings Goals
# =========================================================

def get_savings_goals_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
):

    return (
        db.query(
            SavingsGoal
        )
        .filter(
            SavingsGoal.user_id == user_id
        )
        .order_by(
            SavingsGoal.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# =========================================================
# Get Single Savings Goal
# =========================================================

def get_savings_goal(
    db: Session,
    goal_id: int,
    user_id: int,
):

    return (
        db.query(
            SavingsGoal
        )
        .filter(
            SavingsGoal.id == goal_id,
            SavingsGoal.user_id == user_id,
        )
        .first()
    )


# =========================================================
# Update Savings Goal
# =========================================================

def update_savings_goal(
    db: Session,
    goal: SavingsGoal,
    goal_in: SavingsGoalUpdate,
):

    update_data = goal_in.model_dump(
        exclude_unset=True
    )


    # -------------------------
    # Title
    # -------------------------

    if "title" in update_data:

        update_data["title"] = (
            update_data["title"].strip()
        )

        if not update_data["title"]:

            raise HTTPException(
                status_code=400,
                detail="Goal title cannot be empty.",
            )


    # -------------------------
    # Target Amount
    # -------------------------

    if "target_amount" in update_data:

        new_target = (
            update_data[
                "target_amount"
            ]
        )

        if new_target <= 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Target amount must be "
                    "greater than zero."
                ),
            )


        if (
            goal.current_amount
            > new_target
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Target amount cannot "
                    "be less than the "
                    "current saved amount."
                ),
            )


    # -------------------------
    # Apply Updates
    # -------------------------

    for key, value in update_data.items():

        setattr(
            goal,
            key,
            value,
        )


    # -------------------------
    # Update Status
    # -------------------------

    if (
        goal.current_amount
        >= goal.target_amount
    ):

        goal.status = "completed"

    else:

        goal.status = "in_progress"


    # -------------------------
    # Commit
    # -------------------------

    db.commit()

    db.refresh(goal)

    return goal


# =========================================================
# Contribute to Savings Goal
# =========================================================

def contribute_to_goal(
    db: Session,
    goal: SavingsGoal,
    amount: float,
):

    # -------------------------
    # Validate Amount
    # -------------------------

    if amount <= 0:

        raise HTTPException(
            status_code=400,
            detail=(
                "Contribution amount must "
                "be greater than zero."
            ),
        )


    # -------------------------
    # Check Completed Goal
    # -------------------------

    if goal.status == "completed":

        raise HTTPException(
            status_code=400,
            detail=(
                "This savings goal is "
                "already completed."
            ),
        )


    # -------------------------
    # Check Target Limit
    # -------------------------

    new_amount = (
        goal.current_amount
        + amount
    )


    if (
        new_amount
        > goal.target_amount
    ):

        remaining_amount = (
            goal.target_amount
            - goal.current_amount
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Contribution would exceed "
                f"the target amount. "
                f"You can add up to "
                f"₹{remaining_amount:.2f}."
            ),
        )


    # -------------------------
    # Check Available Balance
    # -------------------------

    available_balance = (
        get_available_balance(
            db,
            goal.user_id,
        )
    )


    if amount > available_balance:

        raise HTTPException(
            status_code=400,
            detail=(
                "Insufficient available "
                "balance. "
                f"Available balance is "
                f"₹{available_balance:.2f}."
            ),
        )


    # -------------------------
    # Old Percentage
    # -------------------------

    old_amount = (
        goal.current_amount
    )

    old_percentage = (
        (
            old_amount
            / goal.target_amount
        ) * 100
    )


    # -------------------------
    # Update Goal Amount
    # -------------------------

    goal.current_amount = (
        new_amount
    )


    # -------------------------
    # New Percentage
    # -------------------------

    new_percentage = (
        (
            new_amount
            / goal.target_amount
        ) * 100
    )


    # =====================================================
    # Create Savings Expense
    # =====================================================
    #
    # This is the important part.
    #
    # The contribution becomes a financial transaction,
    # so the user's available balance decreases.
    # =====================================================

    savings_expense = Expense(

        user_id=goal.user_id,

        category="Savings",

        amount=amount,

        payment_method="Savings Goal",

        bank_name="Savings Goal",

        bank_account_id=None,

        description=(
            f"Contribution to "
            f"'{goal.title}'"
        ),

        date=date.today(),
    )

    db.add(
        savings_expense
    )


    # -------------------------
    # Milestone Detection
    # -------------------------

    milestone = None


    # 50% Milestone

    if (
        old_percentage < 50
        and new_percentage >= 50
    ):

        milestone = 50


    # 100% Completion

    elif (
        old_percentage < 100
        and new_percentage >= 100
    ):

        milestone = 100


    # -------------------------
    # Update Status
    # -------------------------

    if (
        new_amount
        >= goal.target_amount
    ):

        goal.status = "completed"

    else:

        goal.status = "in_progress"


    # =====================================================
    # Notification
    # =====================================================

    if milestone == 50:

        notification = Notification(

            user_id=goal.user_id,

            message=(
                f"Great progress! "
                f"You've reached 50% of "
                f"your '{goal.title}' "
                f"savings goal."
            ),

            type="goal_milestone",

            is_read=False,
        )

        db.add(
            notification
        )


    elif milestone == 100:

        notification = Notification(

            user_id=goal.user_id,

            message=(
                f"Congratulations! "
                f"You've completed "
                f"your '{goal.title}' "
                f"savings goal."
            ),

            type="goal_milestone",

            is_read=False,
        )

        db.add(
            notification
        )


    # -------------------------
    # Commit Everything
    # -------------------------

    db.commit()

    db.refresh(goal)

    return goal


# =========================================================
# Delete Savings Goal
# =========================================================

def delete_savings_goal(
    db: Session,
    goal: SavingsGoal,
):

    db.delete(goal)

    db.commit()