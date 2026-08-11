from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.models.income import Income
from app.models.expense import Expense


def get_dashboard_summary(db: Session, user_id: int):

    # ------------------------------------
    # Summary Cards
    # ------------------------------------

    total_income = (
        db.query(func.coalesce(func.sum(Income.amount), 0))
        .filter(Income.user_id == user_id)
        .scalar()
    )

    total_expense = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.user_id == user_id)
        .scalar()
    )

    balance = total_income - total_expense

    savings = balance

    # ------------------------------------
    # Monthly Income
    # ------------------------------------

    monthly_income = (
        db.query(
            extract("month", Income.date).label("month"),
            func.coalesce(func.sum(Income.amount), 0).label("amount"),
        )
        .filter(Income.user_id == user_id)
        .group_by(extract("month", Income.date))
        .order_by(extract("month", Income.date))
        .all()
    )

    # ------------------------------------
    # Monthly Expense
    # ------------------------------------

    monthly_expense = (
        db.query(
            extract("month", Expense.date).label("month"),
            func.coalesce(func.sum(Expense.amount), 0).label("amount"),
        )
        .filter(Expense.user_id == user_id)
        .group_by(extract("month", Expense.date))
        .order_by(extract("month", Expense.date))
        .all()
    )

    # ------------------------------------
    # Expense Categories
    # ------------------------------------

    expense_categories = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("amount"),
        )
        .filter(Expense.user_id == user_id)
        .group_by(Expense.category)
        .all()
    )

    # ------------------------------------
    # Recent Expenses
    # ------------------------------------

    recent_transactions = (
        db.query(Expense)
        .filter(Expense.user_id == user_id)
        .order_by(Expense.date.desc())
        .limit(5)
        .all()
    )

    return {

        "summary": {

            "total_income": total_income,

            "total_expense": total_expense,

            "balance": balance,

            "savings": savings,

        },

        "monthly_income": [
            {
                "month": int(i.month),
                "amount": float(i.amount),
            }
            for i in monthly_income
        ],

        "monthly_expense": [
            {
                "month": int(i.month),
                "amount": float(i.amount),
            }
            for i in monthly_expense
        ],

        "expense_categories": [
            {
                "category": c.category,
                "amount": float(c.amount),
            }
            for c in expense_categories
        ],

        "recent_transactions": [
            {
                "category": t.category,
                "amount": t.amount,
                "date": t.date.strftime("%d-%m-%Y"),
            }
            for t in recent_transactions
        ],
    }