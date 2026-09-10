"""
Creates/reset the three mentor-demo accounts and realistic sample data.

Accounts:
  NORMAL  demo.normal@budgetbuddy.local
  PREMIUM demo.premium@budgetbuddy.local
  ADMIN   the email configured by ADMIN_EMAIL in .env

Premium is activated directly on the account by an Admin for the
mentor demo (no payment/checkout flow involved).

Usage from backend/:
    python -m scripts.seed_demo_accounts

Optional .env values:
    DEMO_NORMAL_PASSWORD=...
    DEMO_PREMIUM_PASSWORD=...
"""
import os
import sys
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.bank_account import BankAccount
from app.models.budget import Budget, BudgetMonthlyAllocation
from app.models.savings_goal import SavingsGoal
from app.models.activity_log import ActivityLog
from app.core.security import hash_password, validate_password_strength
from app.config import settings

NORMAL_EMAIL = "demo.normal@budgetbuddy.local"
PREMIUM_EMAIL = "demo.premium@budgetbuddy.local"


def _get_or_create(db, email, full_name, password_env_var, default_password):
    password = os.environ.get(password_env_var) or default_password
    try:
        validate_password_strength(password)
    except ValueError as exc:
        print(f"Refusing to seed {email}: {password_env_var} is weak ({exc})")
        sys.exit(1)

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
            role="user",
            account_tier="normal",
            is_verified=True,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.full_name = full_name
        user.hashed_password = hash_password(password)
        user.role = "user"
        user.is_verified = True
        user.is_active = True
        db.commit()
        db.refresh(user)

    return user, password


def _clear_demo_finances(db, user_id):
    # Clear only records owned by the fixed demo accounts.
    budget_ids = [b.id for b in db.query(Budget.id).filter(Budget.user_id == user_id).all()]
    if budget_ids:
        db.query(BudgetMonthlyAllocation).filter(
            BudgetMonthlyAllocation.budget_id.in_(budget_ids)
        ).delete(synchronize_session=False)
    db.query(Budget).filter(Budget.user_id == user_id).delete(synchronize_session=False)
    db.query(Income).filter(Income.user_id == user_id).delete(synchronize_session=False)
    db.query(Expense).filter(Expense.user_id == user_id).delete(synchronize_session=False)
    db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).delete(synchronize_session=False)
    db.query(BankAccount).filter(BankAccount.user_id == user_id).delete(synchronize_session=False)
    db.commit()


def _seed_finances(db, user):
    now = datetime.utcnow()

    salary_bank = BankAccount(
        user_id=user.id,
        bank_name="State Bank of India",
        account_holder_name=user.full_name,
        account_number="458721369852",
        ifsc_code="SBIN0001234",
        account_type="Savings",
        opening_balance=15000,
        balance=15000,
        status="active",
    )
    digital_bank = BankAccount(
        user_id=user.id,
        bank_name="HDFC Bank",
        account_holder_name=user.full_name,
        account_number="623145879632",
        ifsc_code="HDFC0004567",
        account_type="Savings",
        opening_balance=8000,
        balance=8000,
        status="active",
    )
    db.add_all([salary_bank, digital_bank])
    db.commit()
    db.refresh(salary_bank)
    db.refresh(digital_bank)

    # Realistic transactions spread across the current year so monthly/yearly
    # analytics and charts have meaningful data during a mentor demo.
    income_rows = [
        (31, 50000, "Salary", "Salary", "Monthly salary", salary_bank.id),
        (60, 4800, "Freelance", "Freelance", "Freelance project", digital_bank.id),
        (92, 50000, "Salary", "Salary", "Monthly salary", salary_bank.id),
        (122, 6000, "Freelance", "Freelance", "Design project", digital_bank.id),
        (153, 50000, "Salary", "Salary", "Monthly salary", salary_bank.id),
        (184, 7500, "Freelance", "Freelance", "Data analysis project", digital_bank.id),
        (214, 50000, "Salary", "Salary", "Monthly salary", salary_bank.id),
        (245, 5200, "Freelance", "Freelance", "Part-time project", digital_bank.id),
        (now.day, 50000, "Salary", "Salary", "Current month salary", salary_bank.id),
    ]
    for days_ago, amount, source, category, desc, bank_id in income_rows:
        dt = now - timedelta(days=days_ago)
        db.add(Income(
            user_id=user.id, amount=amount, source=source, category=category,
            description=desc, bank_account_id=bank_id, transaction_date=dt,
            created_at=dt, updated_at=dt
        ))

    expense_rows = [
        (27, 8500, "Food", "Groceries and meals", digital_bank.id),
        (23, 3200, "Travel", "Local travel", digital_bank.id),
        (18, 4500, "Shopping", "Personal shopping", salary_bank.id),
        (15, 2100, "Utilities", "Electricity and internet", salary_bank.id),
        (10, 6800, "Education", "Course and books", salary_bank.id),
        (7, 2900, "Entertainment", "Movies and subscriptions", digital_bank.id),
        (4, 4200, "Food", "Weekend meals", digital_bank.id),
        (2, 1800, "Travel", "Cab and transport", digital_bank.id),
        (1, 3500, "Shopping", "Essentials", salary_bank.id),
    ]
    for days_ago, amount, category, desc, bank_id in expense_rows:
        dt = now - timedelta(days=days_ago)
        db.add(Expense(
            user_id=user.id, amount=amount, category=category,
            description=desc, bank_account_id=bank_id, transaction_date=dt,
            created_at=dt, updated_at=dt
        ))

    # Annual budgets + monthly allocations.
    budgets = [
        ("Food", 120000, 9000),
        ("Travel", 60000, 5000),
        ("Shopping", 72000, 6000),
        ("Education", 48000, 4000),
        ("Entertainment", 36000, 3000),
    ]
    for category, annual, monthly in budgets:
        budget = Budget(
            user_id=user.id,
            category=category,
            budget_amount=annual,
            budget_year=now.year,
        )
        db.add(budget)
        db.flush()
        for month in range(1, 13):
            db.add(BudgetMonthlyAllocation(
                budget_id=budget.id,
                month=month,
                allocated_amount=monthly,
            ))

    goals = [
        ("Emergency Fund", 100000, 62000),
        ("New Laptop", 90000, 54000),
        ("Travel Fund", 50000, 30000),
    ]
    for name, target, saved in goals:
        db.add(SavingsGoal(
            user_id=user.id,
            goal_name=name,
            target_amount=target,
            saved_amount=saved,
        ))

    db.commit()


def _seed_activity(db, user):
    now = datetime.utcnow()
    # Only seed a few representative events; real login/logout events are
    # recorded by the application and will appear alongside these.
    for action, detail, days_ago in [
        ("signup", "Demo account created", 10),
        ("email_verified", "Demo email verification completed", 10),
        ("login", "Successful login", 3),
        ("login", "Successful login", 2),
        ("logout", "User logged out", 2),
        ("login", "Successful login", 1),
        ("logout", "User logged out", 1),
    ]:
        dt = now - timedelta(days=days_ago)
        db.add(ActivityLog(
            user_id=user.id,
            action=action,
            detail=detail,
            ip_address="127.0.0.1",
            severity="success",
            created_at=dt,
        ))
    db.commit()


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        normal_user, normal_password = _get_or_create(
            db, NORMAL_EMAIL, "Demo Normal", "DEMO_NORMAL_PASSWORD", "DemoNormal#123"
        )
        premium_user, premium_password = _get_or_create(
            db, PREMIUM_EMAIL, "Demo Premium", "DEMO_PREMIUM_PASSWORD", "DemoPremium#123"
        )

        _clear_demo_finances(db, normal_user.id)
        _clear_demo_finances(db, premium_user.id)
        _seed_finances(db, normal_user)
        _seed_finances(db, premium_user)

        normal_user.account_tier = "normal"
        premium_user.account_tier = "premium"
        db.commit()

        _seed_activity(db, normal_user)
        _seed_activity(db, premium_user)

        print("\nBudgetBuddy mentor demo accounts are ready:\n")
        print(f"  NORMAL   {NORMAL_EMAIL} / {normal_password}")
        print(f"  PREMIUM  {PREMIUM_EMAIL} / {premium_password}")
        print(f"  ADMIN    {settings.ADMIN_EMAIL} / ADMIN_PASSWORD from .env")
        print("\nPremium is activated for demo purposes without payment.")
        print("Run create_admin.py once to promote the configured Admin email.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
