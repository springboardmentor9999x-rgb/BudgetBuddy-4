from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.crud.notification import create_notification
from app.models.budget import Budget
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.core.time import utcnow_naive


def create_expense(db: Session, user_id: int, expense: ExpenseCreate):
    new_expense = Expense(
        user_id=user_id,
        category=expense.category,
        amount=expense.amount,
        description=expense.description,
        bank_account=expense.bank_account,
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    create_notification(db, user_id, f"Expense added: {new_expense.category} (₹{float(new_expense.amount):,.2f}).", "expense_added")
    db.commit()
    _create_budget_alert_if_crossed(db, user_id, new_expense)

    return new_expense


def _create_budget_alert_if_crossed(db: Session, user_id: int, expense: Expense):
    """Notify once when an expense crosses its category limit for the current month."""
    expense_date = expense.date or utcnow_naive()
    month = expense_date.strftime("%Y-%m")
    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category == expense.category,
        Budget.month == month,
    ).first()
    if not budget:
        return

    start = datetime(expense_date.year, expense_date.month, 1)
    end = datetime(start.year + (start.month == 12), (start.month % 12) + 1, 1)
    total_spent = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.user_id == user_id,
        Expense.category == expense.category,
        Expense.date >= start,
        Expense.date < end,
    ).scalar()
    previous_total = float(total_spent) - float(expense.amount)
    if previous_total <= float(budget.amount) < float(total_spent):
        create_notification(
            db,
            user_id,
            f"You've exceeded your {expense.category} budget for {month}.",
            "budget_alert",
        )
        db.commit()


def get_all_expenses(db: Session, user_id: int):
    return (
        db.query(Expense)
        .filter(Expense.user_id == user_id)
        .all()
    )


def get_expense_by_id(db: Session, expense_id: int, user_id: int):
    return (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == user_id
        )
        .first()
    )


def update_expense(
    db: Session,
    expense_id: int,
    user_id: int,
    expense: ExpenseUpdate
):
    db_expense = (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == user_id
        )
        .first()
    )

    if not db_expense:
        return None

    update_data = expense.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_expense, key, value)

    db.commit()
    db.refresh(db_expense)

    create_notification(db, user_id, f"Expense updated: {db_expense.category} (₹{float(db_expense.amount):,.2f}).", "expense_updated")
    db.commit()

    return db_expense


def delete_expense(
    db: Session,
    expense_id: int,
    user_id: int
):
    db_expense = (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == user_id
        )
        .first()
    )

    if not db_expense:
        return None

    category = db_expense.category
    db.delete(db_expense)
    db.commit()
    create_notification(db, user_id, f"Expense deleted: {category}.", "expense_deleted")
    db.commit()

    return db_expense
