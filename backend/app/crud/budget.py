from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.crud.notification import create_notification
from app.models.budget import Budget
from app.models.expense import Expense
from app.schemas.budget import BudgetCreate, BudgetUpdate


def create_budget(db: Session, user_id: int, budget_in: BudgetCreate):
    budget = Budget(user_id=user_id, **budget_in.model_dump())
    db.add(budget)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return None
    db.refresh(budget)
    create_notification(db, user_id, f"Budget added for {budget.category}: ₹{float(budget.amount):,.2f}.", "budget_added")
    db.commit()
    return budget


def get_budgets(db: Session, user_id: int, month: str | None = None):
    query = db.query(Budget).filter(Budget.user_id == user_id)
    if month:
        query = query.filter(Budget.month == month)
    return query.order_by(Budget.category.asc()).all()


def get_budget(db: Session, budget_id: int, user_id: int):
    return db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()


def update_budget(db: Session, budget_id: int, user_id: int, budget_in: BudgetUpdate):
    budget = get_budget(db, budget_id, user_id)
    if not budget:
        return None
    update_data = budget_in.model_dump(exclude_unset=True)
    category = update_data.get("category", budget.category)
    month = update_data.get("month", budget.month)
    duplicate = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category == category,
        Budget.month == month,
        Budget.id != budget.id,
    ).first()
    if duplicate:
        return "conflict"
    for key, value in update_data.items():
        setattr(budget, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return "conflict"
    db.refresh(budget)
    create_notification(db, user_id, f"Budget updated for {budget.category}: ₹{float(budget.amount):,.2f}.", "budget_updated")
    db.commit()
    return budget


def delete_budget(db: Session, budget_id: int, user_id: int):
    budget = get_budget(db, budget_id, user_id)
    if not budget:
        return None
    category = budget.category
    db.delete(budget)
    db.commit()
    create_notification(db, user_id, f"Budget deleted: {category}.", "budget_deleted")
    db.commit()
    return budget


def get_budget_summary(db: Session, user_id: int, month: str):
    start = datetime.strptime(f"{month}-01", "%Y-%m-%d")
    end = datetime(start.year + (start.month == 12), (start.month % 12) + 1, 1)
    budgets = get_budgets(db, user_id, month)
    result = []
    for budget in budgets:
        spent = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == user_id,
            Expense.category == budget.category,
            Expense.date >= start,
            Expense.date < end,
        ).scalar()
        spent = float(spent)
        amount = float(budget.amount)
        result.append({
            "id": budget.id,
            "user_id": budget.user_id,
            "category": budget.category,
            "amount": amount,
            "month": budget.month,
            "spent": spent,
            "remaining": amount - spent,
            "utilization": round((spent / amount) * 100, 2),
        })
    return result
