from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
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
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    query = db.query(
        Expense.category,
        func.sum(
            Expense.amount
        ).label("total"),
    ).filter(
        Expense.user_id == current_user.id
    )

    # ---------------------------------------------------------
    # Premium/Admin
    # ---------------------------------------------------------

    if current_user.role in ["premium", "admin"]:

        if start_date:
            query = query.filter(
                Expense.date >= start_date
            )

        if end_date:
            query = query.filter(
                Expense.date <= end_date
            )

    # ---------------------------------------------------------
    # Student
    # ---------------------------------------------------------

    else:

        now = datetime.utcnow()

        query = query.filter(
            extract("year", Expense.date) == now.year,
            extract("month", Expense.date) == now.month,
        )

    # ---------------------------------------------------------
    # Group and Sort
    # ---------------------------------------------------------

    results = (
        query
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
            "total": float(
                total or 0
            ),
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

    # ---------------------------------------------------------
    # Premium/Admin only
    # ---------------------------------------------------------

    if current_user.role not in [
        "premium",
        "admin",
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "Monthly trend analytics "
                "are available only for "
                "Premium and Admin users"
            ),
        )

    # ---------------------------------------------------------
    # Current Date
    # ---------------------------------------------------------

    now = datetime.utcnow()

    current_year = now.year
    current_month = now.month

    # ---------------------------------------------------------
    # Get Income Data
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # Get Expense Data
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # Store Database Results
    # ---------------------------------------------------------

    income_data = {}

    for year, month, total in income_results:

        key = (
            int(year),
            int(month),
        )

        income_data[key] = float(
            total or 0
        )

    # ---------------------------------------------------------

    expense_data = {}

    for year, month, total in expense_results:

        key = (
            int(year),
            int(month),
        )

        expense_data[key] = float(
            total or 0
        )

    # ---------------------------------------------------------
    # Generate Last 6 Months
    # ---------------------------------------------------------

    monthly_data = []

    for i in range(5, -1, -1):

        # Calculate month/year
        month = current_month - i
        year = current_year

        while month <= 0:

            month += 12
            year -= 1

        key = (
            year,
            month,
        )

        # -----------------------------------------------------
        # Add Month
        # -----------------------------------------------------

        monthly_data.append(
            {
                "year": year,

                "month": month,

                "income": income_data.get(
                    key,
                    0.0
                ),

                "expenses": expense_data.get(
                    key,
                    0.0
                ),
            }
        )

    # ---------------------------------------------------------
    # Return Data
    # ---------------------------------------------------------

    return monthly_data


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
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # ---------------------------------------------------------
    # Determine Date Filtering
    # ---------------------------------------------------------

    premium_or_admin = current_user.role in [
        "premium",
        "admin",
    ]

    # ---------------------------------------------------------
    # Income Query
    # ---------------------------------------------------------

    income_query = (
        db.query(
            func.sum(
                Income.amount
            )
        )
        .filter(
            Income.user_id == current_user.id
        )
    )

    # ---------------------------------------------------------
    # Expense Query
    # ---------------------------------------------------------

    expense_query = (
        db.query(
            func.sum(
                Expense.amount
            )
        )
        .filter(
            Expense.user_id == current_user.id
        )
    )

    # ---------------------------------------------------------
    # Premium/Admin = Custom Date Range
    # ---------------------------------------------------------

    if premium_or_admin:

        if start_date:

            income_query = income_query.filter(
                Income.date >= start_date
            )

            expense_query = expense_query.filter(
                Expense.date >= start_date
            )

        if end_date:

            income_query = income_query.filter(
                Income.date <= end_date
            )

            expense_query = expense_query.filter(
                Expense.date <= end_date
            )

    # ---------------------------------------------------------
    # Student = Current Month
    # ---------------------------------------------------------

    else:

        now = datetime.utcnow()

        income_query = income_query.filter(
            extract(
                "year",
                Income.date
            ) == now.year,

            extract(
                "month",
                Income.date
            ) == now.month,
        )

        expense_query = expense_query.filter(
            extract(
                "year",
                Expense.date
            ) == now.year,

            extract(
                "month",
                Expense.date
            ) == now.month,
        )

    # ---------------------------------------------------------
    # Execute Queries
    # ---------------------------------------------------------

    total_income = (
        income_query.scalar()
        or 0
    )

    total_expenses = (
        expense_query.scalar()
        or 0
    )

    # ---------------------------------------------------------
    # Total Savings
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # Net Balance
    # ---------------------------------------------------------

    net_balance = (
        float(total_income)
        - float(total_expenses)
    )

    # ---------------------------------------------------------
    # Available Balance
    # ---------------------------------------------------------

    available_balance = float(
        net_balance
    )

    # ---------------------------------------------------------
    # Savings Rate
    # ---------------------------------------------------------

    savings_rate = (
        (
            float(net_balance)
            / float(total_income)
        ) * 100
        if float(total_income) > 0
        else 0
    )

    # ---------------------------------------------------------
    # Response
    # ---------------------------------------------------------

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