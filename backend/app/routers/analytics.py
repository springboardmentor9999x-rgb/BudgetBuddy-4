from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.database import get_db
from app.core.deps import get_current_user

from app.models.user import User
from app.models.expense import Expense
from app.models.income import Income
from app.models.savings_goal import SavingsGoal


router = APIRouter()


# =========================================================
# Spending by Category
# =========================================================

@router.get("/spending-by-category")
def spending_by_category(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    results = (
        db.query(
            Expense.category,
            func.sum(
                Expense.amount
            ).label("total"),
        )
        .filter(
            Expense.user_id == current_user.id
        )
        .group_by(
            Expense.category
        )
        .order_by(
            func.sum(
                Expense.amount
            ).desc()
        )
        .all()
    )

    return [
        {
            "category": category,
            "total": float(total or 0),
        }
        for category, total in results
    ]


# =========================================================
# Monthly Trend
# =========================================================

@router.get("/monthly-trend")
def monthly_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # -------------------------
    # Monthly Income
    # -------------------------

    income_results = (
        db.query(
            extract(
                "year",
                Income.date,
            ).label("year"),

            extract(
                "month",
                Income.date,
            ).label("month"),

            func.sum(
                Income.amount
            ).label("total"),
        )
        .filter(
            Income.user_id == current_user.id
        )
        .group_by(
            extract(
                "year",
                Income.date,
            ),

            extract(
                "month",
                Income.date,
            ),
        )
        .all()
    )


    # -------------------------
    # Monthly Expenses
    # -------------------------

    expense_results = (
        db.query(
            extract(
                "year",
                Expense.date,
            ).label("year"),

            extract(
                "month",
                Expense.date,
            ).label("month"),

            func.sum(
                Expense.amount
            ).label("total"),
        )
        .filter(
            Expense.user_id == current_user.id
        )
        .group_by(
            extract(
                "year",
                Expense.date,
            ),

            extract(
                "month",
                Expense.date,
            ),
        )
        .all()
    )


    monthly_data = {}


    # -------------------------
    # Add Income
    # -------------------------

    for year, month, total in income_results:

        key = (
            int(year),
            int(month),
        )

        monthly_data.setdefault(
            key,
            {
                "year": int(year),
                "month": int(month),
                "income": 0.0,
                "expenses": 0.0,
            },
        )

        monthly_data[key]["income"] = float(
            total or 0
        )


    # -------------------------
    # Add Expenses
    # -------------------------

    for year, month, total in expense_results:

        key = (
            int(year),
            int(month),
        )

        monthly_data.setdefault(
            key,
            {
                "year": int(year),
                "month": int(month),
                "income": 0.0,
                "expenses": 0.0,
            },
        )

        monthly_data[key]["expenses"] = float(
            total or 0
        )


    # -------------------------
    # Return Sorted Data
    # -------------------------

    return sorted(
        monthly_data.values(),
        key=lambda item: (
            item["year"],
            item["month"],
        ),
    )


# =========================================================
# Savings Progress
# =========================================================

@router.get("/savings-progress")
def savings_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    goals = (
        db.query(
            SavingsGoal
        )
        .filter(
            SavingsGoal.user_id == current_user.id
        )
        .order_by(
            SavingsGoal.created_at.desc()
        )
        .all()
    )


    return [
        {
            "id": goal.id,

            "title": goal.title,

            "target_amount": float(
                goal.target_amount
            ),

            "current_amount": float(
                goal.current_amount
            ),

            "percentage": round(
                (
                    goal.current_amount
                    / goal.target_amount
                    * 100
                )
                if goal.target_amount > 0
                else 0,
                1,
            ),

            "status": goal.status,

            "target_date": goal.target_date,
        }

        for goal in goals
    ]


# =========================================================
# Analytics Summary
# =========================================================

@router.get("/summary")
def analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # -------------------------
    # Total Income
    # -------------------------

    total_income = (
        db.query(
            func.sum(
                Income.amount
            )
        )
        .filter(
            Income.user_id == current_user.id
        )
        .scalar()
        or 0
    )


    # -------------------------
    # Total Expenses
    #
    # This already includes
    # savings contributions.
    # -------------------------

    total_expenses = (
        db.query(
            func.sum(
                Expense.amount
            )
        )
        .filter(
            Expense.user_id == current_user.id
        )
        .scalar()
        or 0
    )


    # -------------------------
    # Total Savings
    #
    # Informational only.
    # Do NOT subtract this again.
    # -------------------------

    total_savings = (
        db.query(
            func.sum(
                SavingsGoal.current_amount
            )
        )
        .filter(
            SavingsGoal.user_id == current_user.id
        )
        .scalar()
        or 0
    )


    # -------------------------
    # Net Balance
    # -------------------------

    net_balance = (
        float(total_income)
        - float(total_expenses)
    )


    # -------------------------
    # Available Balance
    #
    # Savings contributions
    # are already expenses.
    # -------------------------

    available_balance = (
        float(net_balance)
    )


    # -------------------------
    # Savings Rate
    # -------------------------

    savings_rate = (
        (
            float(net_balance)
            / float(total_income)
        ) * 100
        if float(total_income) > 0
        else 0
    )


    # -------------------------
    # Response
    # -------------------------

    return {
        "total_income": float(
            total_income
        ),

        "total_expenses": float(
            total_expenses
        ),

        "total_savings": float(
            total_savings
        ),

        "net_balance": float(
            net_balance
        ),

        "available_balance": float(
            available_balance
        ),

        "savings_rate": round(
            savings_rate,
            1,
        ),
    }