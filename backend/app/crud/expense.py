from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


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

    return new_expense


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

    db.delete(db_expense)
    db.commit()

    return db_expense
