from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.report import ReportResponse
from app.crud.report import get_report

router = APIRouter(prefix="/report", tags=["Report"])


@router.get("/", response_model=ReportResponse)
def generate_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_report(db, current_user.id)
