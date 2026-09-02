from app.crud.expense import create_expense, get_expense_by_id
from app.crud.income import create_income, get_income_by_id
from app.database import SessionLocal
from app.schemas.expense import ExpenseCreate
from app.schemas.income import IncomeCreate


def test_crud_create_get_and_ownership_filter(user_a, user_b):
    db = SessionLocal()
    try:
        expense = create_expense(db, user_a.id, ExpenseCreate(
            category="Food", amount=250, description="Groceries", bank_account="Test Bank 1234",
        ))
        income = create_income(db, user_a.id, IncomeCreate(
            source="Salary", amount=5000, description="Monthly salary", bank_account="Test Bank 1234",
        ))

        assert get_expense_by_id(db, expense.id, user_a.id).id == expense.id
        assert get_expense_by_id(db, expense.id, user_b.id) is None
        assert get_income_by_id(db, income.id, user_a.id).id == income.id
        assert get_income_by_id(db, income.id, user_b.id) is None
    finally:
        db.close()
