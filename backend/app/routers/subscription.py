from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.subscription_request import SubscriptionRequest
from app.core.deps import get_current_user


# =========================================================
# Subscription Router
# =========================================================

router = APIRouter(
    prefix="/subscription",
    tags=["Subscription"],
)


# =========================================================
# Request Premium
# =========================================================

@router.post("/request")
def request_premium(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Admin Protection
    # -----------------------------------------------------

    if current_user.role.lower() == "admin":

        raise HTTPException(
            status_code=400,
            detail="Admin users already have full access.",
        )

    # -----------------------------------------------------
    # Already Premium
    # -----------------------------------------------------

    if current_user.role.lower() == "premium":

        raise HTTPException(
            status_code=400,
            detail="You are already a Premium user.",
        )

    # -----------------------------------------------------
    # Only Students Can Request Premium
    # -----------------------------------------------------

    if current_user.role.lower() != "student":

        raise HTTPException(
            status_code=400,
            detail="Only student users can request Premium.",
        )

    # -----------------------------------------------------
    # Check Existing Pending Request
    # -----------------------------------------------------

    existing_request = (
        db.query(SubscriptionRequest)
        .filter(
            SubscriptionRequest.user_id
            == current_user.id,

            SubscriptionRequest.status
            == "pending",
        )
        .first()
    )

    if existing_request:

        return {
            "message": (
                "Your Premium subscription "
                "request is already pending."
            ),

            "request_id": (
                existing_request.id
            ),

            "status": "pending",

            "plan": "premium",
        }

    # -----------------------------------------------------
    # Create New Premium Request
    # -----------------------------------------------------

    subscription_request = SubscriptionRequest(
        user_id=current_user.id,
        plan="premium",
        status="pending",
    )

    db.add(subscription_request)

    db.commit()

    db.refresh(subscription_request)

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {

        "message": (
            "Premium subscription request "
            "sent to the administrator."
        ),

        "request_id": (
            subscription_request.id
        ),

        "status": (
            subscription_request.status
        ),

        "plan": (
            subscription_request.plan
        ),

    }


# =========================================================
# Get My Subscription Request
# =========================================================

@router.get("/my-request")
def get_my_subscription_request(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Find Latest Request
    # -----------------------------------------------------

    request = (
        db.query(SubscriptionRequest)
        .filter(
            SubscriptionRequest.user_id
            == current_user.id
        )
        .order_by(
            SubscriptionRequest.created_at.desc()
        )
        .first()
    )

    # -----------------------------------------------------
    # No Request
    # -----------------------------------------------------

    if not request:

        return {

            "has_request": False,

            "request_id": None,

            "plan": None,

            "status": None,

            "created_at": None,

            "updated_at": None,

        }

    # -----------------------------------------------------
    # Current User Role
    # -----------------------------------------------------

    current_role = (
        current_user.role.lower()
        if current_user.role
        else ""
    )

    # -----------------------------------------------------
    # IMPORTANT:
    #
    # If the database still contains an old "approved"
    # request but the user's current role is Student,
    # the Premium subscription has already been removed.
    #
    # Therefore the frontend must NOT show:
    #
    # "Premium Approved"
    #
    # Instead, return "cancelled".
    # -----------------------------------------------------

    status = request.status

    if (
        current_role == "student"
        and status == "approved"
    ):

        status = "cancelled"

    # -----------------------------------------------------
    # Return Subscription Information
    # -----------------------------------------------------

    return {

        "has_request": True,

        "request_id": (
            request.id
        ),

        "plan": (
            request.plan
        ),

        "status": status,

        "created_at": (
            request.created_at
        ),

        "updated_at": (
            request.updated_at
        ),

    }