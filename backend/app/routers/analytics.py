from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.analytics import monthly_trend, savings_progress, spending_by_category, summary
from app.database import get_db
from app.models.user import User
from app.core.time import month_bounds

router = APIRouter()


@router.get("/spending-by-category")
def category_spending(month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    start, end = month_bounds(month)
    return spending_by_category(db, current_user.id, start, end)


@router.get("/monthly-trend")
def trend(months: int = Query(default=6, ge=1, le=12), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return monthly_trend(db, current_user.id, months)


@router.get("/savings-progress")
def goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return savings_progress(db, current_user.id)


@router.get("/summary")
def analytics_summary(month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    start, end = month_bounds(month)
    return summary(db, current_user.id, start, end)
