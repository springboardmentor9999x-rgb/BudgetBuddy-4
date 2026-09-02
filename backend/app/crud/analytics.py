from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.income import Income
from app.models.saving_goal import SavingGoal
from app.core.time import utcnow_naive


def _month_start(value: datetime) -> datetime:
    return datetime(value.year, value.month, 1)


def spending_by_category(db: Session, user_id: int):
    rows = db.query(Expense.category, func.sum(Expense.amount).label("total")).filter(
        Expense.user_id == user_id
    ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all()
    return [{"category": row.category, "total": float(row.total)} for row in rows]


def monthly_trend(db: Session, user_id: int, months: int = 6):
    now = utcnow_naive()
    cursor = _month_start(now)
    month_starts = []
    for _ in range(months):
        month_starts.append(cursor)
        cursor = datetime(cursor.year - (cursor.month == 1), 12 if cursor.month == 1 else cursor.month - 1, 1)
    result = []
    for start in reversed(month_starts):
        end = datetime(start.year + (start.month == 12), (start.month % 12) + 1, 1)
        income = db.query(func.coalesce(func.sum(Income.amount), 0)).filter(Income.user_id == user_id, Income.amount > 0, Income.date >= start, Income.date < end).scalar()
        expenses = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(Expense.user_id == user_id, Expense.date >= start, Expense.date < end).scalar()
        result.append({"month": start.strftime("%b %Y"), "income": float(income), "expenses": float(expenses)})
    return result


def savings_progress(db: Session, user_id: int):
    goals = db.query(SavingGoal).filter(SavingGoal.user_id == user_id).order_by(SavingGoal.created_at.desc()).all()
    return [{
        "id": goal.id, "goal_name": goal.goal_name, "target_amount": float(goal.target_amount),
        "saved_amount": float(goal.saved_amount or 0), "status": goal.status,
        "progress_percentage": round(min((float(goal.saved_amount or 0) / float(goal.target_amount)) * 100, 100), 2),
    } for goal in goals]


def summary(db: Session, user_id: int):
    income = float(db.query(func.coalesce(func.sum(Income.amount), 0)).filter(Income.user_id == user_id, Income.amount > 0).scalar())
    expenses = float(db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(Expense.user_id == user_id).scalar())
    balance = income - expenses
    return {"total_income": income, "total_expenses": expenses, "net_balance": balance, "savings_rate": round((balance / income) * 100, 2) if income else 0}
