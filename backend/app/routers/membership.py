from datetime import datetime, timedelta, timezone
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.notification import create_notification
from app.database import get_db
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.admin import PaymentVerify
from app.services.payments import create_order, fetch_payment, verify_signature

router = APIRouter()
PRICE_PAISE = 29900


def current_subscription(db, user_id):
    now = datetime.now(timezone.utc)
    return db.query(Subscription).filter(Subscription.user_id == user_id, Subscription.status == "active", Subscription.expires_at > now).order_by(Subscription.expires_at.desc()).first()


def activate_premium(db, user, *, plan="premium_monthly", days=30):
    now = datetime.now(timezone.utc)
    subscription = Subscription(user_id=user.id, status="active", plan=plan, starts_at=now, expires_at=now + timedelta(days=days))
    db.add(subscription)
    user.plan = "premium"
    if user.role != "admin":
        user.role = "premium"
    return subscription


def payment_required():
    return os.getenv("PREMIUM_PAYMENT_REQUIRED", "true").strip().lower() == "true"


@router.get("/plans")
def plans():
    return [{"id": "premium_monthly", "name": "Premium Monthly", "amount": PRICE_PAISE / 100, "amount_paise": PRICE_PAISE, "currency": "INR", "duration_days": 30, "payment_required": payment_required()}]


@router.get("/me")
def membership(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subscription = current_subscription(db, current_user.id)
    if not subscription and current_user.plan == "premium":
        current_user.plan = "free"
        if current_user.role == "premium":
            current_user.role = "user"
        db.commit()
    return {"plan": "premium" if subscription else "free", "is_premium": bool(subscription), "subscription": subscription}


@router.delete("/me")
def cancel_membership(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subscription = current_subscription(db, current_user.id)
    if subscription:
        subscription.status = "cancelled"
    current_user.plan = "free"
    if current_user.role == "premium":
        current_user.role = "user"
    create_notification(db, current_user.id, "Your Premium membership was cancelled.", "membership_updated")
    db.commit()
    return {"plan": "free", "is_premium": False}


@router.get("/payments")
def payment_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Payment).filter(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()).all()


@router.post("/orders")
def new_order(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receipt = f"bb-{current_user.id}-{int(datetime.now(timezone.utc).timestamp())}"
    key_id, order = create_order(PRICE_PAISE, receipt)
    subscription = Subscription(user_id=current_user.id, status="pending", plan="premium_monthly")
    db.add(subscription)
    db.flush()
    db.add(Payment(user_id=current_user.id, subscription_id=subscription.id, provider_order_id=order["id"], amount=PRICE_PAISE / 100, currency="INR", status="pending"))
    db.commit()
    return {"key_id": key_id, "order_id": order["id"], "amount": PRICE_PAISE, "currency": "INR", "name": "BudgetBuddy Premium"}


@router.post("/upgrade")
def upgrade_without_payment(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payment_required():
        raise HTTPException(status_code=402, detail="Verified payment is required for Premium")
    subscription = current_subscription(db, current_user.id)
    if not subscription:
        subscription = activate_premium(db, current_user, plan="premium_access", days=365)
        create_notification(db, current_user.id, "Premium access is now active.", "membership_updated")
        db.commit()
    return {"verified": True, "payment_required": False, "plan": "premium", "expires_at": subscription.expires_at}


@router.post("/demo-upgrade")
def demo_upgrade(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    environment = os.getenv("APP_ENV", "").strip().lower()
    enabled = os.getenv("DEMO_PAYMENTS_ENABLED", "").strip().lower() == "true"
    if environment not in {"development", "dev", "test"} or not enabled:
        raise HTTPException(status_code=404, detail="Development demo payments are disabled")
    subscription = current_subscription(db, current_user.id)
    if not subscription:
        subscription = activate_premium(db, current_user, plan="premium_demo", days=30)
        create_notification(db, current_user.id, "Development demo Premium access is active for 30 days.", "membership_updated")
        db.commit()
    return {"verified": True, "demo": True, "plan": "premium", "expires_at": subscription.expires_at}


@router.post("/verify")
def verify_payment(data: PaymentVerify, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payment = db.query(Payment).filter(Payment.provider_order_id == data.razorpay_order_id, Payment.user_id == current_user.id).first()
    if not payment or payment.status == "successful":
        if payment and payment.status == "successful":
            return {"verified": True, "plan": "premium"}
        raise HTTPException(status_code=404, detail="Payment order not found")
    payment.provider_payment_id = data.razorpay_payment_id
    if not verify_signature(payment.provider_order_id, data.razorpay_payment_id, data.razorpay_signature):
        payment.status = "failed"
        payment.subscription.status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment signature verification failed")
    provider_payment = fetch_payment(data.razorpay_payment_id)
    if provider_payment.get("status") != "captured" or provider_payment.get("order_id") != payment.provider_order_id or provider_payment.get("amount") != PRICE_PAISE:
        payment.status = "pending"
        db.commit()
        raise HTTPException(status_code=409, detail="Payment has not been captured")
    now = datetime.now(timezone.utc)
    payment.status = "successful"
    payment.paid_at = now
    payment.subscription.status = "active"
    payment.subscription.starts_at = now
    payment.subscription.expires_at = now + timedelta(days=30)
    current_user.plan = "premium"
    if current_user.role != "admin":
        current_user.role = "premium"
    create_notification(db, current_user.id, "Payment verified. Premium is active for 30 days.", "membership_updated")
    db.commit()
    return {"verified": True, "plan": "premium", "expires_at": payment.subscription.expires_at}
