from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal


def _year_bounds(year: int):
    return datetime(year, 1, 1), datetime(year + 1, 1, 1)


def get_dashboard_summary(db: Session, user_id: int, year: int | None = None) -> dict:
    """Return the user's financial snapshot for a calendar year."""
    current_year = year or datetime.utcnow().year
    year_start, next_year_start = _year_bounds(current_year)

    income_date = func.coalesce(Income.transaction_date, Income.created_at)
    expense_date = func.coalesce(Expense.transaction_date, Expense.created_at)

    total_income = (
        db.query(func.coalesce(func.sum(Income.amount), 0))
        .filter(Income.user_id == user_id, income_date >= year_start, income_date < next_year_start)
        .scalar() or 0
    )
    total_expense = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.user_id == user_id, expense_date >= year_start, expense_date < next_year_start)
        .scalar() or 0
    )
    total_budget = (
        db.query(func.coalesce(func.sum(Budget.budget_amount), 0))
        .filter(Budget.user_id == user_id, Budget.budget_year == current_year)
        .scalar() or 0
    )

    savings_target = (
        db.query(func.coalesce(func.sum(SavingsGoal.target_amount), 0))
        .filter(SavingsGoal.user_id == user_id)
        .scalar() or 0
    )
    savings_saved = (
        db.query(func.coalesce(func.sum(SavingsGoal.saved_amount), 0))
        .filter(SavingsGoal.user_id == user_id)
        .scalar() or 0
    )

    total_income = float(total_income)
    total_expense = float(total_expense)
    total_budget = float(total_budget)
    savings_target = float(savings_target)
    savings_saved = float(savings_saved)

    remaining_balance = total_income - total_expense
    remaining_budget = total_budget - total_expense
    raw_progress = (total_expense / total_budget * 100) if total_budget > 0 else 0.0
    budget_progress = round(max(0.0, min(raw_progress, 100.0)), 2)
    budget_exceeded = total_budget > 0 and total_expense > total_budget
    savings_progress = round(
        max(0.0, min((savings_saved / savings_target * 100) if savings_target > 0 else 0.0, 100.0)), 2
    )

    return {
        "user_id": user_id,
        "year": current_year,
        "total_income": total_income,
        "total_expense": total_expense,
        "total_budget": total_budget,
        "remaining_balance": remaining_balance,
        "remaining_budget": remaining_budget,
        "budget_progress_percentage": budget_progress,
        "budget_exceeded": budget_exceeded,
        "savings_target": savings_target,
        "savings_saved": savings_saved,
        "savings_progress_percentage": savings_progress,
    }
