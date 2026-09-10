from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas.admin import AdminUserResponse, ActivityLogResponse, AdminDashboardStats, AdminTierUpdate
from app.schemas.notification import AdminAnnouncementCreate, NotificationResponse

from app.crud.user import (
    list_users,
    get_user_by_id,
    set_user_active_status,
    delete_user,
    get_admin_dashboard_stats,
    set_user_account_tier,
)
from app.crud.activity_log import get_activity_logs, log_activity
from app.crud.notification import broadcast_notification, create_notification, create_notification_for_user_if_enabled
from app.schemas.premium_request import PremiumRequestAdminResponse
from app.crud.premium_request import list_requests, get_request_by_id, decide_request
from app.core.sms import send_sms

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


@router.get("/dashboard", response_model=AdminDashboardStats)
def admin_dashboard(db: Session = Depends(get_db)):
    return get_admin_dashboard_stats(db)


@router.get("/users", response_model=list[AdminUserResponse])
def get_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return list_users(db, skip=skip, limit=limit)


@router.get("/users/{user_id}", response_model=AdminUserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}/activate", response_model=AdminUserResponse)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user = set_user_active_status(db, user, True)
    log_activity(db, admin_user.id, "admin_activated_user", detail=f"Activated user #{user_id}")
    create_notification(
        db, user.id, "Account reactivated",
        "Your BudgetBuddy account has been reactivated by an administrator.",
        category="admin_announcement",
    )
    return user


@router.put("/users/{user_id}/deactivate", response_model=AdminUserResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")

    user = set_user_active_status(db, user, False)
    log_activity(db, admin_user.id, "admin_deactivated_user", detail=f"Deactivated user #{user_id}")
    return user


@router.put("/users/{user_id}/tier", response_model=AdminUserResponse)
def update_user_tier(
    user_id: int,
    payload: AdminTierUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    if payload.account_tier not in ("normal", "premium"):
        raise HTTPException(status_code=400, detail="Tier must be normal or pro.")
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Admin accounts cannot be assigned a customer tier.")
    user = set_user_account_tier(db, user, payload.account_tier)
    log_activity(
        db, admin_user.id, "admin_changed_user_tier",
        detail=f"User #{user_id} -> {payload.account_tier}"
    )
    return user


@router.delete("/users/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")

    delete_user(db, user)
    log_activity(db, admin_user.id, "admin_deleted_user", detail=f"Deleted user #{user_id}")
    return {"message": "User deleted successfully"}


@router.get("/activity-logs", response_model=list[ActivityLogResponse])
def view_activity_logs(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    return get_activity_logs(db, skip=skip, limit=limit)


@router.post("/announcements")
def send_announcement(
    payload: AdminAnnouncementCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    if payload.target_user_id:
        target = get_user_by_id(db, payload.target_user_id)
        if not target:
            raise HTTPException(status_code=404, detail="Target user not found")
        notification = create_notification(
            db, target.id, payload.title, payload.message, category="admin_announcement"
        )
        log_activity(db, admin_user.id, "admin_announcement", detail=f"To user #{target.id}")
        return notification

    count = broadcast_notification(db, payload.title, payload.message)
    log_activity(db, admin_user.id, "admin_announcement", detail=f"Broadcast to {count} users")
    return {"message": f"Announcement sent to {count} users"}


@router.get("/system-analytics")
def system_analytics(db: Session = Depends(get_db)):
    stats = get_admin_dashboard_stats(db)
    from app.models.income import Income
    from app.models.expense import Expense
    from sqlalchemy import func

    # Keep platform-level counts only. Financial amounts are deliberately
    # excluded from the Admin surface.
    return {
        "total_transactions": (db.query(func.count(Income.id)).scalar() or 0)
        + (db.query(func.count(Expense.id)).scalar() or 0),
        "normal_users": (
            db.query(func.count(User.id))
            .filter(User.account_tier == "normal", User.role != "admin")
            .scalar() or 0
        ),
        "premium_users": (
            db.query(func.count(User.id))
            .filter(User.account_tier == "premium", User.role != "admin")
            .scalar() or 0
        ),
        **stats,
    }


@router.get("/premium-requests", response_model=list[PremiumRequestAdminResponse])
def list_premium_requests(status: str | None = None, db: Session = Depends(get_db)):
    requests = list_requests(db, status=status)
    results = []
    for r in requests:
        target = get_user_by_id(db, r.user_id)
        results.append(
            PremiumRequestAdminResponse(
                id=r.id,
                user_id=r.user_id,
                full_name=target.full_name if target else None,
                email=target.email if target else "unknown",
                account_tier=target.account_tier if target else "normal",
                status=r.status,
                note=r.note,
                created_at=r.created_at,
                reviewed_at=r.reviewed_at,
            )
        )
    return results


@router.post("/premium-requests/{request_id}/approve", response_model=PremiumRequestAdminResponse)
def approve_premium_request(
    request_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    req = get_request_by_id(db, request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Premium request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request already {req.status}")

    req = decide_request(db, req, approve=True, reviewer=admin_user)
    target = get_user_by_id(db, req.user_id)
    if target:
        create_notification_for_user_if_enabled(
            db, target, title="Premium activated!",
            message="Your Premium request was approved by the Admin. Enjoy Advanced Financial Intelligence.",
            category="premium",
        )
        send_sms(target.phone_number, "BudgetBuddy: Your Premium request was approved! Advanced features are now unlocked.")
    log_activity(db, admin_user.id, "premium_request_approved", detail=f"Request #{request_id} for user #{req.user_id}")
    return PremiumRequestAdminResponse(
        id=req.id, user_id=req.user_id, full_name=target.full_name if target else None,
        email=target.email if target else "unknown", account_tier=target.account_tier if target else "normal",
        status=req.status, note=req.note, created_at=req.created_at, reviewed_at=req.reviewed_at,
    )


@router.post("/premium-requests/{request_id}/reject", response_model=PremiumRequestAdminResponse)
def reject_premium_request(
    request_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    req = get_request_by_id(db, request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Premium request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request already {req.status}")

    req = decide_request(db, req, approve=False, reviewer=admin_user)
    target = get_user_by_id(db, req.user_id)
    if target:
        create_notification_for_user_if_enabled(
            db, target, title="Premium request declined",
            message="Your Premium request was reviewed and was not approved. You can request again anytime.",
            category="premium",
        )
        send_sms(target.phone_number, "BudgetBuddy: Your Premium request was reviewed and was not approved this time.")
    log_activity(db, admin_user.id, "premium_request_rejected", detail=f"Request #{request_id} for user #{req.user_id}")
    return PremiumRequestAdminResponse(
        id=req.id, user_id=req.user_id, full_name=target.full_name if target else None,
        email=target.email if target else "unknown", account_tier=target.account_tier if target else "normal",
        status=req.status, note=req.note, created_at=req.created_at, reviewed_at=req.reviewed_at,
    )
