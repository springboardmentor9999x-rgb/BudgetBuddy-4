from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.crud.dashboard import get_dashboard_summary

router = APIRouter()


@router.get("/")
def dashboard(
    month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_dashboard_summary(
        db,
        current_user.id,
        month,
    )
