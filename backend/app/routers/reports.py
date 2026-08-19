from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.core.deps import get_current_user

from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.savings_goal import SavingsGoal


router = APIRouter()


# =========================================================
# Monthly Report
# =========================================================

@router.get("/monthly")
def monthly_report(
    month: int = Query(
        ...,
        ge=1,
        le=12,
    ),
    year: int = Query(
        ...,
        ge=2000,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # =====================================================
    # Total Income
    # =====================================================

    total_income = (
        db.query(
            func.sum(
                Income.amount
            )
        )
        .filter(
            Income.user_id == current_user.id,

            func.extract(
                "month",
                Income.date,
            ) == month,

            func.extract(
                "year",
                Income.date,
            ) == year,
        )
        .scalar()
        or 0
    )


    # =====================================================
    # Total Expenses
    #
    # This already includes savings contributions because
    # contribute_to_goal() creates an Expense record.
    # =====================================================

    total_expenses = (
        db.query(
            func.sum(
                Expense.amount
            )
        )
        .filter(
            Expense.user_id == current_user.id,

            func.extract(
                "month",
                Expense.date,
            ) == month,

            func.extract(
                "year",
                Expense.date,
            ) == year,
        )
        .scalar()
        or 0
    )


    # =====================================================
    # Total Savings
    #
    # This is displayed as information only.
    # It must NOT be subtracted again from the balance.
    # =====================================================

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


    # =====================================================
    # Net Savings
    #
    # Income - Expenses
    #
    # Since savings contributions are already expenses,
    # they are automatically included here.
    # =====================================================

    net_savings = (
        float(total_income)
        - float(total_expenses)
    )


    # =====================================================
    # Available Amount
    #
    # Same calculation because savings contributions
    # are already included inside total_expenses.
    # =====================================================

    available_amount = (
        float(total_income)
        - float(total_expenses)
    )


    # =====================================================
    # Savings Rate
    # =====================================================

    savings_rate = (
        (
            net_savings
            / float(total_income)
        ) * 100
        if float(total_income) > 0
        else 0
    )


    # =====================================================
    # Spending by Category
    # =====================================================

    category_results = (
        db.query(
            Expense.category,
            func.sum(
                Expense.amount
            ).label("total"),
        )
        .filter(
            Expense.user_id == current_user.id,

            func.extract(
                "month",
                Expense.date,
            ) == month,

            func.extract(
                "year",
                Expense.date,
            ) == year,
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


    spending_by_category = [
        {
            "category": category,
            "total": float(
                total or 0
            ),
        }

        for category, total
        in category_results
    ]


    # =====================================================
    # Response
    # =====================================================

    return {
        "month": month,

        "year": year,

        "total_income": float(
            total_income
        ),

        "total_expenses": float(
            total_expenses
        ),

        "total_savings": float(
            total_savings
        ),

        "net_savings": float(
            net_savings
        ),

        "available_amount": float(
            available_amount
        ),

        "savings_rate": round(
            savings_rate,
            1,
        ),

        "spending_by_category":
            spending_by_category,
    }