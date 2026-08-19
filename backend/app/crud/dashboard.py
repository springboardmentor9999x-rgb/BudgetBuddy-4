from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.income import Income
from app.models.expense import Expense
from app.models.savings_goal import SavingsGoal
from app.models.bank_account import BankAccount


def get_dashboard_data(
    db: Session,
    user_id: int,
):
    # -------------------------
    # Total Income
    # -------------------------
    total_income = (
        db.query(func.sum(Income.amount))
        .filter(
            Income.user_id == user_id
        )
        .scalar()
        or 0
    )

    # -------------------------
    # Total Expense
    # -------------------------
    total_expense = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == user_id
        )
        .scalar()
        or 0
    )

    # -------------------------
    # Total Savings Goals
    # -------------------------
    total_savings = (
        db.query(
            func.sum(
                SavingsGoal.current_amount
            )
        )
        .filter(
            SavingsGoal.user_id == user_id
        )
        .scalar()
        or 0
    )

    # -------------------------
    # Current Bank Balance
    #
    # Opening Balance
    # + Bank-linked Income
    # - Bank-linked Expenses
    # -------------------------

    total_opening_balance = (
        db.query(
            func.coalesce(
                func.sum(
                    BankAccount.opening_balance
                ),
                0,
            )
        )
        .filter(
            BankAccount.user_id == user_id
        )
        .scalar()
        or 0
    )

    bank_income = (
        db.query(
            func.coalesce(
                func.sum(Income.amount),
                0,
            )
        )
        .join(
            BankAccount,
            Income.bank_account_id
            == BankAccount.id,
        )
        .filter(
            Income.user_id == user_id,
            BankAccount.user_id == user_id,
        )
        .scalar()
        or 0
    )

    bank_expense = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0,
            )
        )
        .join(
            BankAccount,
            Expense.bank_account_id
            == BankAccount.id,
        )
        .filter(
            Expense.user_id == user_id,
            BankAccount.user_id == user_id,
        )
        .scalar()
        or 0
    )

    balance = (
        float(total_opening_balance)
        + float(bank_income)
        - float(bank_expense)
    )

    # -------------------------
    # Expense Summary
    # -------------------------
    summary = (
        db.query(
            Expense.category,
            func.sum(
                Expense.amount
            ).label("total"),
        )
        .filter(
            Expense.user_id == user_id
        )
        .group_by(
            Expense.category
        )
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
        .filter(
            Income.user_id == user_id
        )
        .order_by(
            Income.date.desc()
        )
        .limit(5)
        .all()
    )

    # -------------------------
    # Recent Expense
    # -------------------------
    recent_expense = (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id
        )
        .order_by(
            Expense.date.desc()
        )
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

    # -------------------------
    # Sort Latest First
    # -------------------------
    recent_transactions = sorted(
        recent_transactions,
        key=lambda x: x["date"],
        reverse=True,
    )[:5]

    # -------------------------
    # Return Dashboard Data
    # -------------------------
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "total_savings": total_savings,
        "balance": balance,
        "expense_summary": expense_summary,
        "recent_transactions": recent_transactions,
    }