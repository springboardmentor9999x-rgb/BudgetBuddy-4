from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.income import Income
from app.models.expense import Expense


def get_dashboard_data(db: Session, user_id: int):
    # -------------------------
    # Total Income
    # -------------------------
    total_income = (
        db.query(func.sum(Income.amount))
        .filter(Income.user_id == user_id)
        .scalar()
        or 0
    )

    # -------------------------
    # Total Expense
    # -------------------------
    total_expense = (
        db.query(func.sum(Expense.amount))
        .filter(Expense.user_id == user_id)
        .scalar()
        or 0
    )

    # -------------------------
    # Expense Summary
    # -------------------------
    summary = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
        )
        .filter(Expense.user_id == user_id)
        .group_by(Expense.category)
        .all()
    )

    expense_summary = [
        {
            "category": item.category,
            "total": item.total,
        }
        for item in summary
    ]

    # -------------------------
    # Recent Income
    # -------------------------
    recent_income = (
        db.query(Income)
        .filter(Income.user_id == user_id)
        .order_by(Income.date.desc())
        .limit(5)
        .all()
    )

    # -------------------------
    # Recent Expense
    # -------------------------
    recent_expense = (
        db.query(Expense)
        .filter(Expense.user_id == user_id)
        .order_by(Expense.date.desc())
        .limit(5)
        .all()
    )

    # -------------------------
    # Merge Transactions
    # -------------------------
    recent_transactions = []

    for income in recent_income:
        recent_transactions.append(
            {
                "type": "Income",
                "title": income.source,
                "amount": income.amount,
                "date": income.date,
            }
        )

    for expense in recent_expense:
        recent_transactions.append(
            {
                "type": "Expense",
                "title": expense.category,
                "amount": expense.amount,
                "date": expense.date,
            }
        )

    # Sort latest first
    recent_transactions = sorted(
        recent_transactions,
        key=lambda x: x["date"],
        reverse=True,
    )[:5]

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "expense_summary": expense_summary,
        "recent_transactions": recent_transactions,
    }