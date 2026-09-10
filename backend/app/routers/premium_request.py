from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.premium_request import PremiumRequestCreate, PremiumRequestResponse
from app.crud.premium_request import (
    get_pending_request_for_user,
    get_latest_request_for_user,
    create_request,
)
from app.crud.notification import create_notification_for_user_if_enabled
from app.crud.activity_log import log_activity
from app.core.sms import send_sms

router = APIRouter(prefix="/premium-requests", tags=["Premium Requests"])


@router.post("", response_model=PremiumRequestResponse, status_code=status.HTTP_201_CREATED)
def request_premium(
    payload: PremiumRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role == "admin" or current_user.account_tier == "premium":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account already has Premium access.",
        )

    if get_pending_request_for_user(db, current_user.id) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending Premium request. Please wait for Admin review.",
        )

    req = create_request(db, current_user.id, payload.note)

    create_notification_for_user_if_enabled(
        db,
        current_user,
        title="Premium request submitted",
        message="Your request to upgrade to Premium has been sent to the Admin for review.",
        category="premium",
    )
    send_sms(current_user.phone_number, "BudgetBuddy: Your Premium upgrade request was submitted and is pending Admin review.")
    log_activity(
        db,
        current_user.id,
        "premium_request_submitted",
        detail=f"User #{current_user.id} requested Premium upgrade",
    )

    return req


@router.get("/me", response_model=PremiumRequestResponse | None)
def my_latest_request(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_latest_request_for_user(db, current_user.id)
