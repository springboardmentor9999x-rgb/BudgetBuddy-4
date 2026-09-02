from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.subscription_request import SubscriptionRequest
from app.core.deps import require_role


# =========================================================
# Admin Router
# =========================================================

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# =========================================================
# Admin Dependency
# =========================================================

require_admin = require_role("admin")


# =========================================================
# Get All Users
# =========================================================

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    users = (
        db.query(User)
        .order_by(User.id.asc())
        .all()
    )

    return users


# =========================================================
# Deactivate User
# =========================================================

@router.patch("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Prevent admin from deactivating themselves
    if user.id == current_user.id:

        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account",
        )

    user.is_active = False

    db.commit()
    db.refresh(user)

    return {
        "message": "User deactivated successfully",
        "user_id": user.id,
        "is_active": user.is_active,
    }


# =========================================================
# Activate User
# =========================================================

@router.patch("/users/{user_id}/activate")
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    user.is_active = True

    db.commit()
    db.refresh(user)

    return {
        "message": "User activated successfully",
        "user_id": user.id,
        "is_active": user.is_active,
    }


# =========================================================
# Change User Role
# =========================================================

@router.patch("/users/{user_id}/role")
def change_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    # -----------------------------------------------------
    # Find User
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # -----------------------------------------------------
    # Validate Role
    # -----------------------------------------------------

    allowed_roles = [
        "student",
        "premium",
        "admin",
    ]

    if role not in allowed_roles:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid role. "
                "Allowed roles: student, premium, admin"
            ),
        )

    # -----------------------------------------------------
    # Prevent Admin From Changing Own Role
    # -----------------------------------------------------

    if user.id == current_user.id:

        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role",
        )

    # -----------------------------------------------------
    # Update Role
    # -----------------------------------------------------

    user.role = role

    db.commit()
    db.refresh(user)

    return {
        "message": "User role updated successfully",
        "user_id": user.id,
        "role": user.role,
    }


# =========================================================
# Get Subscription Requests
# =========================================================

@router.get("/subscription-requests")
def get_subscription_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    requests = (
        db.query(SubscriptionRequest)
        .order_by(
            SubscriptionRequest.created_at.desc()
        )
        .all()
    )

    result = []

    for request in requests:

        user = (
            db.query(User)
            .filter(
                User.id == request.user_id
            )
            .first()
        )

        result.append({

            "id": request.id,

            "user_id": request.user_id,

            "email": (
                user.email
                if user
                else None
            ),

            "plan": request.plan,

            "status": request.status,

            "created_at": request.created_at,

            "updated_at": request.updated_at,

        })

    return result


# =========================================================
# Approve Premium Subscription
# =========================================================

@router.patch(
    "/subscription-requests/{request_id}/approve"
)
def approve_subscription_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    # -----------------------------------------------------
    # Find Request
    # -----------------------------------------------------

    subscription_request = (
        db.query(SubscriptionRequest)
        .filter(
            SubscriptionRequest.id
            == request_id
        )
        .first()
    )

    if subscription_request is None:

        raise HTTPException(
            status_code=404,
            detail="Subscription request not found",
        )

    # -----------------------------------------------------
    # Check Request Status
    # -----------------------------------------------------

    if subscription_request.status != "pending":

        raise HTTPException(
            status_code=400,
            detail=(
                "This subscription request "
                "has already been processed."
            ),
        )

    # -----------------------------------------------------
    # Find User
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.id
            == subscription_request.user_id
        )
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User associated with request not found",
        )

    # -----------------------------------------------------
    # Approve Request
    # -----------------------------------------------------

    subscription_request.status = "approved"

    # Upgrade user
    user.role = "premium"

    db.commit()

    db.refresh(subscription_request)
    db.refresh(user)

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {

        "message": (
            "Premium subscription "
            "approved successfully."
        ),

        "request_id": (
            subscription_request.id
        ),

        "user_id": user.id,

        "email": user.email,

        "role": user.role,

        "status": (
            subscription_request.status
        ),

    }


# =========================================================
# Remove Premium Subscription
# =========================================================

@router.patch(
    "/users/{user_id}/remove-premium"
)
def remove_premium_subscription(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    # -----------------------------------------------------
    # Find User
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # -----------------------------------------------------
    # Prevent Removing Premium From Non-Premium User
    # -----------------------------------------------------

    if user.role != "premium":

        raise HTTPException(
            status_code=400,
            detail="User does not have Premium subscription",
        )

    # -----------------------------------------------------
    # Remove Premium
    # -----------------------------------------------------

    user.role = "student"

    db.commit()
    db.refresh(user)

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {

        "message": (
            "Premium subscription "
            "removed successfully."
        ),

        "user_id": user.id,

        "email": user.email,

        "role": user.role,

    }


# =========================================================
# Reject Premium Subscription
# =========================================================

@router.patch(
    "/subscription-requests/{request_id}/reject"
)
def reject_subscription_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    # -----------------------------------------------------
    # Find Request
    # -----------------------------------------------------

    subscription_request = (
        db.query(SubscriptionRequest)
        .filter(
            SubscriptionRequest.id
            == request_id
        )
        .first()
    )

    if subscription_request is None:

        raise HTTPException(
            status_code=404,
            detail="Subscription request not found",
        )

    # -----------------------------------------------------
    # Check Request Status
    # -----------------------------------------------------

    if subscription_request.status != "pending":

        raise HTTPException(
            status_code=400,
            detail=(
                "This subscription request "
                "has already been processed."
            ),
        )

    # -----------------------------------------------------
    # Find User
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.id
            == subscription_request.user_id
        )
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User associated with request not found",
        )

    # -----------------------------------------------------
    # Reject Request
    # -----------------------------------------------------

    subscription_request.status = "rejected"

    # User remains student
    user.role = "student"

    db.commit()

    db.refresh(subscription_request)
    db.refresh(user)

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {

        "message": (
            "Premium subscription "
            "request rejected."
        ),

        "request_id": (
            subscription_request.id
        ),

        "user_id": user.id,

        "email": user.email,

        "role": user.role,

        "status": (
            subscription_request.status
        ),

    }