from datetime import date
from typing import Optional
from io import BytesIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from reportlab.pdfgen import canvas

from app.database import get_db
from app.core.deps import get_current_user

from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.savings_goal import SavingsGoal


router = APIRouter()


# =========================================================
# Monthly / Date Range Report
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

    from_date: Optional[date] = Query(
        None
    ),

    to_date: Optional[date] = Query(
        None
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    # =====================================================
    # Determine Report Period
    # =====================================================

    if from_date is None:

        from_date = date(
            year,
            month,
            1,
        )


    if to_date is None:

        if month == 12:

            to_date = date(
                year + 1,
                1,
                1,
            )

        else:

            to_date = date(
                year,
                month + 1,
                1,
            )

    else:

        # Include selected date
        # because database date is inclusive.

        pass


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
            Income.user_id
            == current_user.id,

            Income.date >= from_date,

            Income.date <= to_date,
        )
        .scalar()
        or 0
    )


    # =====================================================
    # Total Expenses
    #
    # Savings contributions are already stored
    # as Expense records.
    # =====================================================

    total_expenses = (
        db.query(
            func.sum(
                Expense.amount
            )
        )
        .filter(
            Expense.user_id
            == current_user.id,

            Expense.date >= from_date,

            Expense.date <= to_date,
        )
        .scalar()
        or 0
    )


    # =====================================================
    # Total Savings
    #
    # Information only.
    # =====================================================

    total_savings = (
        db.query(
            func.sum(
                SavingsGoal.current_amount
            )
        )
        .filter(
            SavingsGoal.user_id
            == current_user.id
        )
        .scalar()
        or 0
    )


    # =====================================================
    # Net Savings
    # =====================================================

    net_savings = (
        float(total_income)
        - float(total_expenses)
    )


    # =====================================================
    # Available Amount
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
            Expense.user_id
            == current_user.id,

            Expense.date >= from_date,

            Expense.date <= to_date,
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

        "from_date": str(
            from_date
        ),

        "to_date": str(
            to_date
        ),

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