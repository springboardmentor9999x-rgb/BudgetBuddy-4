from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.income import Income
from app.models.saving_goal import SavingGoal


def month_bounds(year: int, month: int) -> tuple[datetime, datetime]:
    start = datetime(year, month, 1)
    end = datetime(year + (month == 12), (month % 12) + 1, 1)
    return start, end


def monthly_report(db: Session, user_id: int, year: int, month: int) -> dict:
    start, end = month_bounds(year, month)
    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user_id, Expense.date >= start, Expense.date < end)
        .order_by(Expense.date.desc(), Expense.id.desc())
        .all()
    )
    incomes = (
        db.query(Income)
        .filter(Income.user_id == user_id, Income.amount > 0, Income.date >= start, Income.date < end)
        .order_by(Income.date.desc(), Income.id.desc())
        .all()
    )

    total_income = sum(float(item.amount or 0) for item in incomes)
    total_expenses = sum(float(item.amount or 0) for item in expenses)
    net_balance = total_income - total_expenses
    income_before = float(db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
        Income.user_id == user_id, Income.amount > 0, Income.date < start
    ).scalar())
    expenses_before = float(db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == user_id, Expense.date < start
    ).scalar())
    opening_balance = income_before - expenses_before
    categories = (
        db.query(Expense.category, func.sum(Expense.amount).label("total"))
        .filter(Expense.user_id == user_id, Expense.date >= start, Expense.date < end)
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    transactions = [
        {
            "id": item.id,
            "type": "expense",
            "label": item.category,
            "description": item.description,
            "amount": float(item.amount or 0),
            "date": item.date.isoformat() if item.date else None,
        }
        for item in expenses
    ] + [
        {
            "id": item.id,
            "type": "income",
            "label": item.source,
            "description": item.description,
            "amount": float(item.amount or 0),
            "date": item.date.isoformat() if item.date else None,
        }
        for item in incomes
    ]
    transactions.sort(key=lambda item: item["date"] or "", reverse=True)

    goals = db.query(SavingGoal).filter(SavingGoal.user_id == user_id).order_by(SavingGoal.created_at.desc()).all()
    goal_progress = [
        {
            "id": goal.id,
            "goal_name": goal.goal_name,
            "target_amount": float(goal.target_amount),
            "saved_amount": float(goal.saved_amount or 0),
            "progress_percentage": round(min(float(goal.saved_amount or 0) / float(goal.target_amount) * 100, 100), 2),
            "status": goal.status,
        }
        for goal in goals
    ]

    return {
        "period": {"year": year, "month": month, "label": start.strftime("%B %Y")},
        "summary": {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_balance": net_balance,
            "opening_balance": opening_balance,
            "closing_balance": opening_balance + net_balance,
            "savings_rate": round((net_balance / total_income) * 100, 2) if total_income else 0,
            "income_count": len(incomes),
            "expense_count": len(expenses),
        },
        "spending_by_category": [
            {"category": row.category, "total": float(row.total or 0)} for row in categories
        ],
        "transactions": transactions,
        "savings_progress": goal_progress,
    }
