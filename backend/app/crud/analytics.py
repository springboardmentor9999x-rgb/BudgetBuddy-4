import calendar
from datetime import date

from sqlalchemy.orm import Session

from app.models.income import Income
from app.models.expense import Expense
from app.models.bank_account import BankAccount
from app.models.budget import Budget


def _fetch_month_rows(db: Session, model, user_id: int, year: int, month: int,
                       bank_id: int | None = None, category: str | None = None):
    """
    Returns rows of the given model (Income or Expense) for this user in the
    given year/month, filtered in Python by transaction_date (NOT created_at)
    so backdated entries land in the correct month regardless of when they
    were actually entered into the system.
    """
    query = db.query(model).filter(model.user_id == user_id)

    if bank_id is not None:
        query = query.filter(model.bank_account_id == bank_id)
    if category is not None:
        query = query.filter(model.category == category)

    rows = query.all()

    return [
        r for r in rows
        if r.transaction_date is not None
        and r.transaction_date.year == year
        and r.transaction_date.month == month
    ]


def _category_breakdown(rows, total: float) -> list[dict]:
    buckets: dict[str, float] = {}
    for r in rows:
        buckets[r.category] = buckets.get(r.category, 0.0) + r.amount

    return [
        {
            "category": cat,
            "amount": amount,
            "percentage": round((amount / total) * 100, 1) if total > 0 else 0.0,
        }
        for cat, amount in sorted(buckets.items(), key=lambda kv: -kv[1])
    ]


def _fetch_year_rows(db: Session, model, user_id: int, year: int,
                      bank_id: int | None = None, category: str | None = None):
    """
    Same as _fetch_month_rows but for an entire year (no month filter).
    Also filters by transaction_date, not created_at.
    """
    query = db.query(model).filter(model.user_id == user_id)

    if bank_id is not None:
        query = query.filter(model.bank_account_id == bank_id)
    if category is not None:
        query = query.filter(model.category == category)

    rows = query.all()

    return [
        r for r in rows
        if r.transaction_date is not None and r.transaction_date.year == year
    ]


def _mask_account_number(account_number: str | None) -> str:
    raw = account_number or ""
    return f"XXXX XXXX {raw[-4:]}" if len(raw) >= 4 else "XXXX XXXX XXXX"


MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def get_yearly_analysis(
    db: Session,
    user_id: int,
    year: int,
    bank_id: int | None = None,
    category: str | None = None,
) -> dict:
    income_rows = _fetch_year_rows(db, Income, user_id, year, bank_id, category)
    expense_rows = _fetch_year_rows(db, Expense, user_id, year, bank_id, category)

    total_income = sum(r.amount for r in income_rows)
    total_expense = sum(r.amount for r in expense_rows)
    savings = total_income - total_expense
    savings_percentage = round((savings / total_income) * 100, 1) if total_income > 0 else None

    income_by_category = _category_breakdown(income_rows, total_income)
    expense_by_category = _category_breakdown(expense_rows, total_expense)

    # Bank-wise (annual), with transaction counts as requested.
    bank_query = db.query(BankAccount).filter(BankAccount.user_id == user_id)
    if bank_id is not None:
        bank_query = bank_query.filter(BankAccount.id == bank_id)
    banks = bank_query.all()

    bank_analysis = []
    for bank in banks:
        bank_income_rows = [r for r in income_rows if r.bank_account_id == bank.id]
        bank_expense_rows = [r for r in expense_rows if r.bank_account_id == bank.id]
        bank_income = sum(r.amount for r in bank_income_rows)
        bank_expense = sum(r.amount for r in bank_expense_rows)

        bank_analysis.append({
            "bank_id": bank.id,
            "bank_name": bank.bank_name,
            "masked_account_number": _mask_account_number(bank.account_number),
            "total_income": bank_income,
            "total_expense": bank_expense,
            "net_change": bank_income - bank_expense,
            "transaction_count": len(bank_income_rows) + len(bank_expense_rows),
        })

    # Annual budget (across budgeted categories for this year, optionally
    # narrowed to one category).
    budget_query = db.query(Budget).filter(Budget.user_id == user_id, Budget.budget_year == year)
    if category is not None:
        budget_query = budget_query.filter(Budget.category == category)
    budgets = budget_query.all()

    expense_by_category_map = {c["category"]: c["amount"] for c in expense_by_category}

    total_annual_allocated = 0.0
    total_annual_spent = 0.0
    for b in budgets:
        total_annual_allocated += b.budget_amount
        total_annual_spent += expense_by_category_map.get(b.category, 0.0)

    yearly_budget_summary = {
        "yearly_budget": total_annual_allocated,
        "spent": total_annual_spent,
        "remaining": total_annual_allocated - total_annual_spent,
        "percent_used": round((total_annual_spent / total_annual_allocated) * 100, 1) if total_annual_allocated > 0 else 0.0,
        "is_over_budget": total_annual_spent > total_annual_allocated,
    }

    # Month-by-month breakdown - all 12 months always present, zeros where
    # there's no data (never dropped/fabricated).
    monthly_breakdown = []
    for month in range(1, 13):
        m_income_rows = [r for r in income_rows if r.transaction_date.month == month]
        m_expense_rows = [r for r in expense_rows if r.transaction_date.month == month]
        m_income = sum(r.amount for r in m_income_rows)
        m_expense = sum(r.amount for r in m_expense_rows)
        m_savings = m_income - m_expense

        m_expense_by_cat = {}
        for r in m_expense_rows:
            m_expense_by_cat[r.category] = m_expense_by_cat.get(r.category, 0.0) + r.amount

        m_allocated = 0.0
        m_spent = 0.0
        for b in budgets:
            allocation = next((a for a in b.monthly_allocations if a.month == month), None)
            allocated = allocation.allocated_amount if allocation else 0.0
            m_allocated += allocated
            m_spent += m_expense_by_cat.get(b.category, 0.0)

        monthly_breakdown.append({
            "month": month,
            "month_name": MONTH_NAMES[month - 1],
            "income": m_income,
            "expense": m_expense,
            "savings": m_savings,
            "budget": m_allocated,
            "budget_used": m_spent,
            "budget_remaining": m_allocated - m_spent,
        })

    num_income_transactions = len(income_rows)
    num_expense_transactions = len(expense_rows)
    avg_monthly_income = round(total_income / 12, 2)
    avg_monthly_expense = round(total_expense / 12, 2)
    avg_monthly_savings = round(savings / 12, 2)

    # Highest/lowest months - always resolvable since all 12 months are present.
    highest_income_month = max(monthly_breakdown, key=lambda m: m["income"])
    highest_expense_month = max(monthly_breakdown, key=lambda m: m["expense"])
    highest_savings_month = max(monthly_breakdown, key=lambda m: m["savings"])
    lowest_savings_month = min(monthly_breakdown, key=lambda m: m["savings"])

    # Year-over-year comparison - only if the previous year has ANY data at
    # all; otherwise return None entirely rather than fake/zero values.
    prev_year = year - 1
    prev_income_rows = _fetch_year_rows(db, Income, user_id, prev_year, bank_id, category)
    prev_expense_rows = _fetch_year_rows(db, Expense, user_id, prev_year, bank_id, category)

    year_over_year = None
    if prev_income_rows or prev_expense_rows:
        prev_income = sum(r.amount for r in prev_income_rows)
        prev_expense = sum(r.amount for r in prev_expense_rows)
        prev_savings = prev_income - prev_expense

        def _pct_change(current: float, previous: float) -> float | None:
            if previous == 0:
                return None
            return round(((current - previous) / abs(previous)) * 100, 1)

        year_over_year = {
            "previous_year": prev_year,
            "current_year_income": total_income,
            "previous_year_income": prev_income,
            "income_change_percent": _pct_change(total_income, prev_income),
            "current_year_expense": total_expense,
            "previous_year_expense": prev_expense,
            "expense_change_percent": _pct_change(total_expense, prev_expense),
            "current_year_savings": savings,
            "previous_year_savings": prev_savings,
            "savings_change_percent": _pct_change(savings, prev_savings),
        }

    return {
        "year": year,
        "bank_filter": bank_id,
        "category_filter": category,
        "total_income": total_income,
        "total_expense": total_expense,
        "savings": savings,
        "savings_percentage": savings_percentage,
        "num_income_transactions": num_income_transactions,
        "num_expense_transactions": num_expense_transactions,
        "avg_monthly_income": avg_monthly_income,
        "avg_monthly_expense": avg_monthly_expense,
        "avg_monthly_savings": avg_monthly_savings,
        "income_by_category": income_by_category,
        "expense_by_category": expense_by_category,
        "bank_analysis": bank_analysis,
        "budget": yearly_budget_summary,
        "monthly_breakdown": monthly_breakdown,
        "highest_income_month": highest_income_month,
        "highest_expense_month": highest_expense_month,
        "highest_savings_month": highest_savings_month,
        "lowest_savings_month": lowest_savings_month,
        "year_over_year": year_over_year,
    }


def get_monthly_analysis(
    db: Session,
    user_id: int,
    year: int,
    month: int,
    bank_id: int | None = None,
    category: str | None = None,
) -> dict:
    income_rows = _fetch_month_rows(db, Income, user_id, year, month, bank_id, category)
    expense_rows = _fetch_month_rows(db, Expense, user_id, year, month, bank_id, category)

    total_income = sum(r.amount for r in income_rows)
    total_expense = sum(r.amount for r in expense_rows)
    savings = total_income - total_expense
    savings_percentage = round((savings / total_income) * 100, 1) if total_income > 0 else None

    income_by_category = _category_breakdown(income_rows, total_income)
    expense_by_category = _category_breakdown(expense_rows, total_expense)

    # Bank-wise: only over the user's own bank accounts, optionally narrowed
    # to a single one if bank_id filter is set.
    bank_query = db.query(BankAccount).filter(BankAccount.user_id == user_id)
    if bank_id is not None:
        bank_query = bank_query.filter(BankAccount.id == bank_id)
    banks = bank_query.all()

    bank_analysis = []
    for bank in banks:
        bank_income = sum(r.amount for r in income_rows if r.bank_account_id == bank.id)
        bank_expense = sum(r.amount for r in expense_rows if r.bank_account_id == bank.id)

        raw = bank.account_number or ""
        masked = f"XXXX XXXX {raw[-4:]}" if len(raw) >= 4 else "XXXX XXXX XXXX"

        bank_analysis.append({
            "bank_id": bank.id,
            "bank_name": bank.bank_name,
            "masked_account_number": masked,
            "total_income": bank_income,
            "total_expense": bank_expense,
            "net_change": bank_income - bank_expense,
        })

    # Budget: aggregate across the user's budgeted categories for this year,
    # narrowed to the requested category if a filter was given. "Spent" here
    # is real expense spend in that category/month (using transaction_date,
    # already computed above per-category), not the raw total_expense.
    budget_query = db.query(Budget).filter(Budget.user_id == user_id, Budget.budget_year == year)
    if category is not None:
        budget_query = budget_query.filter(Budget.category == category)
    budgets = budget_query.all()

    expense_by_category_map = {c["category"]: c["amount"] for c in expense_by_category}

    budget_categories = []
    total_allocated = 0.0
    total_budget_spent = 0.0

    for b in budgets:
        allocation = next((a for a in b.monthly_allocations if a.month == month), None)
        allocated = allocation.allocated_amount if allocation else 0.0
        spent = expense_by_category_map.get(b.category, 0.0)

        total_allocated += allocated
        total_budget_spent += spent

        budget_categories.append({
            "category": b.category,
            "allocated": allocated,
            "spent": spent,
            "remaining": allocated - spent,
            "percent_used": round((spent / allocated) * 100, 1) if allocated > 0 else 0.0,
            "is_over_budget": spent > allocated,
        })

    budget_summary = {
        "monthly_budget": total_allocated,
        "spent": total_budget_spent,
        "remaining": total_allocated - total_budget_spent,
        "percent_used": round((total_budget_spent / total_allocated) * 100, 1) if total_allocated > 0 else 0.0,
        "is_over_budget": total_budget_spent > total_allocated,
        "categories": budget_categories,
    }

    # Daily trend: one real (not fabricated) data point per day of the month,
    # summing whatever income/expense actually happened that day. Days with
    # no transactions correctly show 0, they are not invented.
    days_in_month = calendar.monthrange(year, month)[1]
    daily_trend = []
    for day in range(1, days_in_month + 1):
        day_income = sum(r.amount for r in income_rows if r.transaction_date.day == day)
        day_expense = sum(r.amount for r in expense_rows if r.transaction_date.day == day)
        daily_trend.append({
            "date": date(year, month, day).isoformat(),
            "income": day_income,
            "expense": day_expense,
            "savings": day_income - day_expense,
        })

    return {
        "year": year,
        "month": month,
        "bank_filter": bank_id,
        "category_filter": category,
        "total_income": total_income,
        "total_expense": total_expense,
        "savings": savings,
        "savings_percentage": savings_percentage,
        "income_by_category": income_by_category,
        "expense_by_category": expense_by_category,
        "bank_analysis": bank_analysis,
        "budget": budget_summary,
        "daily_trend": daily_trend,
    }
