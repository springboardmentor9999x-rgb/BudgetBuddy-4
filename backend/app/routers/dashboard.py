from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.crud.dashboard import get_dashboard_summary

router = APIRouter()


@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_dashboard_summary(
        db,
        current_user.id,
    )