from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database import get_db
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.notification import Notification
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from app.schemas.admin import UserAccessUpdate
from app.schemas.user import UserOut

router = APIRouter()


@router.get("/overview")
def overview(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    users = db.query(User)
    incomes = db.query(Income).count()
    expenses = db.query(Expense).count()
    successful = db.query(Payment).filter(Payment.status == "successful")
    total_income = float(db.query(func.coalesce(func.sum(Income.amount), 0)).filter(Income.amount > 0).scalar())
    total_expenses = float(db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar())
    now = datetime.now(timezone.utc)
    user_growth = {}
    transaction_trend = {}
    for offset in range(5, -1, -1):
        month = now.month - offset
        year = now.year
        while month <= 0:
            month += 12
            year -= 1
        key = f"{year}-{month:02d}"
        label = datetime(year, month, 1).strftime("%b")
        user_growth[key] = {"month": label, "users": 0}
        transaction_trend[key] = {"month": label, "income": 0.0, "expenses": 0.0}
    for created_at, in db.query(User.created_at).all():
        if created_at:
            key = created_at.strftime("%Y-%m")
            if key in user_growth:
                user_growth[key]["users"] += 1
    for occurred_at, amount in db.query(Income.date, Income.amount).all():
        if occurred_at:
            key = occurred_at.strftime("%Y-%m")
            if key in transaction_trend:
                transaction_trend[key]["income"] += float(amount)
    for occurred_at, amount in db.query(Expense.date, Expense.amount).all():
        if occurred_at:
            key = occurred_at.strftime("%Y-%m")
            if key in transaction_trend:
                transaction_trend[key]["expenses"] += float(amount)
    return {
        "total_users": users.count(),
        "active_users": users.filter(User.is_active.is_(True)).count(),
        "free_users": users.filter(User.plan == "free").count(),
        "premium_users": users.filter(User.plan == "premium").count(),
        "admins": users.filter(User.role == "admin").count(),
        "verified_users": users.filter(User.is_verified.is_(True)).count(),
        "total_income_records": incomes,
        "total_expense_records": expenses,
        "total_transactions": incomes + expenses,
        "successful_payments": successful.count(),
        "premium_revenue": float(successful.with_entities(func.coalesce(func.sum(Payment.amount), 0)).scalar()),
        "new_users": users.filter(User.created_at >= now - timedelta(days=30)).count(),
        "system_income": total_income,
        "system_expenses": total_expenses,
        "user_growth": list(user_growth.values()),
        "plan_distribution": [{"name": "Free", "value": users.filter(User.plan == "free").count()}, {"name": "Premium", "value": users.filter(User.plan == "premium").count()}],
        "transaction_trend": list(transaction_trend.values()),
    }


@router.get("/system-analytics")
def system_analytics(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    income = float(db.query(func.coalesce(func.sum(Income.amount), 0)).filter(Income.amount > 0).scalar())
    expenses = float(db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar())
    categories = db.query(Expense.category, func.sum(Expense.amount).label("total")).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all()
    return {"total_income": income, "total_expenses": expenses, "net": income - expenses, "categories": [{"category": row.category, "total": float(row.total)} for row in categories]}


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/users/{user_id}/financial-summary")
def user_financial_summary(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    income = float(db.query(func.coalesce(func.sum(Income.amount), 0)).filter(Income.user_id == user_id, Income.amount > 0).scalar())
    expenses = float(db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(Expense.user_id == user_id).scalar())
    return {"user_id": user_id, "income": income, "expenses": expenses, "balance": income - expenses, "income_records": db.query(Income).filter(Income.user_id == user_id).count(), "expense_records": db.query(Expense).filter(Expense.user_id == user_id).count()}


@router.get("/activity")
def activity(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = db.query(Notification, User).join(User, User.id == Notification.user_id).order_by(Notification.created_at.desc()).limit(200).all()
    return [{"id": item.id, "user": user.full_name, "email": user.email, "type": item.type, "message": item.message, "created_at": item.created_at} for item, user in rows]


@router.get("/premium-users")
def premium_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Subscription).filter(Subscription.status == "active").order_by(Subscription.expires_at.desc()).all()


@router.get("/payments")
def payments(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = db.query(Payment, User).join(User, User.id == Payment.user_id).order_by(Payment.created_at.desc()).all()
    return [{"id": p.id, "user": u.full_name, "user_name": u.full_name, "email": u.email, "provider_order_id": p.provider_order_id, "provider_payment_id": p.provider_payment_id, "provider": p.provider, "amount": p.amount, "currency": p.currency, "status": p.status, "paid_at": p.paid_at, "created_at": p.created_at} for p, u in rows]


@router.patch("/users/{user_id}", response_model=UserOut)
def update_access(user_id: int, update: UserAccessUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id and update.role == "user":
        raise HTTPException(status_code=400, detail="You cannot remove your own administrator access")
    for field, value in update.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
