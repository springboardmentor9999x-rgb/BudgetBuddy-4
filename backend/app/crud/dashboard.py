from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.income import Income


def get_dashboard_summary(db: Session, user_id: int):
    """Return the current-month summary plus chart-ready historical data."""
    now = datetime.utcnow()
    start = datetime(now.year, now.month, 1)
    end = datetime(start.year + (start.month == 12), (start.month % 12) + 1, 1)

    total_income = float(db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
        Income.user_id == user_id, Income.date >= start, Income.date < end
    ).scalar())
    total_expense = float(db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == user_id, Expense.date >= start, Expense.date < end
    ).scalar())

    monthly_income = db.query(
        func.extract("month", Income.date).label("month"), func.sum(Income.amount).label("amount")
    ).filter(Income.user_id == user_id).group_by(func.extract("month", Income.date)).order_by(func.extract("month", Income.date)).all()
    monthly_expense = db.query(
        func.extract("month", Expense.date).label("month"), func.sum(Expense.amount).label("amount")
    ).filter(Expense.user_id == user_id).group_by(func.extract("month", Expense.date)).order_by(func.extract("month", Expense.date)).all()
    categories = db.query(Expense.category, func.sum(Expense.amount).label("amount")).filter(
        Expense.user_id == user_id, Expense.date >= start, Expense.date < end
    ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).limit(3).all()

    expenses = db.query(Expense).filter(Expense.user_id == user_id).order_by(Expense.date.desc()).limit(5).all()
    incomes = db.query(Income).filter(Income.user_id == user_id).order_by(Income.date.desc()).limit(5).all()
    transactions = [
        {"category": item.category, "amount": float(item.amount), "date": item.date, "type": "expense"}
        for item in expenses
    ] + [
        {"category": item.source, "amount": float(item.amount), "date": item.date, "type": "income"}
        for item in incomes
    ]
    transactions.sort(key=lambda item: item["date"].timestamp() if item["date"] else 0, reverse=True)

    return {
        "summary": {"total_income": total_income, "total_expense": total_expense, "balance": total_income - total_expense, "savings": total_income - total_expense},
        "monthly_income": [{"month": int(item.month), "amount": float(item.amount)} for item in monthly_income],
        "monthly_expense": [{"month": int(item.month), "amount": float(item.amount)} for item in monthly_expense],
        "expense_categories": [{"category": item.category, "amount": float(item.amount)} for item in categories],
        "recent_transactions": [{**item, "date": item["date"].strftime("%d-%m-%Y")} for item in transactions[:5]],
    }
