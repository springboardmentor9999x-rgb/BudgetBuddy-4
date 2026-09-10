from datetime import datetime

from sqlalchemy.orm import Session

from app.models.premium_request import PremiumRequest
from app.models.user import User


def get_pending_request_for_user(db: Session, user_id: int) -> PremiumRequest | None:
    return (
        db.query(PremiumRequest)
        .filter(PremiumRequest.user_id == user_id, PremiumRequest.status == "pending")
        .first()
    )


def get_latest_request_for_user(db: Session, user_id: int) -> PremiumRequest | None:
    return (
        db.query(PremiumRequest)
        .filter(PremiumRequest.user_id == user_id)
        .order_by(PremiumRequest.created_at.desc())
        .first()
    )


def create_request(db: Session, user_id: int, note: str | None) -> PremiumRequest:
    req = PremiumRequest(user_id=user_id, note=note, status="pending")
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def list_requests(db: Session, status: str | None = None) -> list[PremiumRequest]:
    query = db.query(PremiumRequest)
    if status:
        query = query.filter(PremiumRequest.status == status)
    return query.order_by(PremiumRequest.created_at.desc()).all()


def get_request_by_id(db: Session, request_id: int) -> PremiumRequest | None:
    return db.query(PremiumRequest).filter(PremiumRequest.id == request_id).first()


def decide_request(
    db: Session,
    request: PremiumRequest,
    approve: bool,
    reviewer: User,
) -> PremiumRequest:
    request.status = "approved" if approve else "rejected"
    request.reviewed_by_id = reviewer.id
    request.reviewed_at = datetime.utcnow()

    if approve:
        target = db.query(User).filter(User.id == request.user_id).first()
        if target is not None and target.role != "admin":
            target.account_tier = "premium"

    db.commit()
    db.refresh(request)
    return request
