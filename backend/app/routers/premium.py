from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import require_premium
from app.crud.analytics import monthly_trend, savings_progress, spending_by_category, summary
from app.database import get_db
from app.models.user import User
from app.models.expense import Expense

router = APIRouter()


@router.get("/insights")
def advanced_insights(start_date: date | None = Query(None), end_date: date | None = Query(None), db: Session = Depends(get_db), current_user: User = Depends(require_premium)):
    end = datetime.combine((end_date or date.today()) + timedelta(days=1), datetime.min.time())
    start = datetime.combine(start_date or (date.today() - timedelta(days=365)), datetime.min.time())
    if start >= end or (end - start).days > 730:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Choose a valid date range of up to two years")
    totals = summary(db, current_user.id, start, end)
    categories = spending_by_category(db, current_user.id, start, end)
    expense_rows = db.query(Expense).filter(Expense.user_id == current_user.id, Expense.date >= start, Expense.date < end).all()
    grouped = {}
    for expense in expense_rows:
        key = (expense.date.strftime("%b %Y"), expense.category)
        grouped[key] = grouped.get(key, 0) + float(expense.amount)
    breakdown = [{"month": month, "category": category, "total": total} for (month, category), total in grouped.items()]
    this_month = summary(db, current_user.id)
    first_this_month = datetime(date.today().year, date.today().month, 1)
    last_month_end = first_this_month
    last_month_start = datetime(first_this_month.year - (first_this_month.month == 1), 12 if first_this_month.month == 1 else first_this_month.month - 1, 1)
    previous = summary(db, current_user.id, last_month_start, last_month_end)
    expense_change = round(((this_month["total_expenses"] - previous["total_expenses"]) / previous["total_expenses"]) * 100, 2) if previous["total_expenses"] else 0
    return {"summary": totals, "categories": categories, "yearly_trend": monthly_trend(db, current_user.id, 12), "category_over_time": breakdown, "comparison": {"current": this_month, "previous": previous, "expense_change_percent": expense_change}, "goals": savings_progress(db, current_user.id), "largest_category": categories[0] if categories else None}
