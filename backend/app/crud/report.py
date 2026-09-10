from datetime import datetime



from sqlalchemy.orm import Session

from sqlalchemy import func



from app.models.income import Income

from app.models.expense import Expense

from app.models.budget import Budget

from app.models.savings_goal import SavingsGoal





def get_report(db: Session, user_id: int):



    total_income = (

        db.query(func.sum(Income.amount))

        .filter(Income.user_id == user_id)

        .scalar() or 0

    )



    total_expense = (

        db.query(func.sum(Expense.amount))

        .filter(Expense.user_id == user_id)

        .scalar() or 0

    )



    # Budgets now have a year dimension (one row per category per year), so

    # summing every row would double/triple count across years. The report's

    # "current" budget figure should reflect the current year only.

    current_year = datetime.utcnow().year

    total_budget = (

        db.query(func.sum(Budget.budget_amount))

        .filter(Budget.user_id == user_id, Budget.budget_year == current_year)

        .scalar() or 0

    )



    total_saved = (

        db.query(func.sum(SavingsGoal.saved_amount))

        .filter(SavingsGoal.user_id == user_id)

        .scalar() or 0

    )



    remaining_balance = total_income - total_expense



    return {

        "user_id": user_id,

        "total_income": total_income,

        "total_expense": total_expense,

        "total_budget": total_budget,

        "total_saved": total_saved,

        "remaining_balance": remaining_balance

    }