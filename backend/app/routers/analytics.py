from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_active_user, require_premium_user
from app.models.user import User
from app.schemas.analytics import MonthlyAnalysisResponse, YearlyAnalysisResponse
from app.crud.analytics import get_monthly_analysis, get_yearly_analysis

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/monthly", response_model=MonthlyAnalysisResponse)
def monthly_analysis(
    year: int = Query(default_factory=lambda: datetime.utcnow().year),
    month: int = Query(default_factory=lambda: datetime.utcnow().month, ge=1, le=12),
    bank_id: int | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Real monthly financial analysis for the authenticated user only.
    User identity always comes from the JWT (current_user) - never from a
    client-supplied user_id - so this can never return another user's data.
    """
    return get_monthly_analysis(
        db,
        current_user.id,
        year=year,
        month=month,
        bank_id=bank_id,
        category=category,
    )


@router.get("/yearly", response_model=YearlyAnalysisResponse)
def yearly_analysis(
    year: int = Query(default_factory=lambda: datetime.utcnow().year),
    bank_id: int | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium_user),
):
    """
    Real yearly financial analysis for the authenticated user only. Same
    ownership guarantee as /analytics/monthly: identity always comes from
    the JWT, never from a client-supplied user_id.

    PREMIUM-GATED: this is the 6-12 month trend / historical analysis
    view. Normal-tier users get 403 here even via direct API calls -
    require_premium_user enforces this server-side, not just in the UI.
    """
    return get_yearly_analysis(
        db,
        current_user.id,
        year=year,
        bank_id=bank_id,
        category=category,
    )
