"""Create opt-in development-only accounts for demonstrating role-based access."""
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.profile import Profile
from app.models.subscription import Subscription
from app.models.user import User


def required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} must be configured in backend/.env")
    return value


def upsert_account(db, *, name: str, email: str, password: str, role: str, plan: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(full_name=name, email=email, password=hash_password(password), is_verified=True)
        db.add(user)
        db.flush()
        db.add(Profile(user_id=user.id))
    else:
        user.full_name = name
        user.password = hash_password(password)
        user.is_verified = True
    user.is_active = True
    user.role = role
    user.plan = plan
    return user


def main() -> None:
    environment = os.getenv("APP_ENV", "").strip().lower()
    enabled = os.getenv("DEMO_SEED_ENABLED", "").strip().lower() == "true"
    if environment not in {"development", "dev", "test"} or not enabled:
        raise RuntimeError("Demo seeding is disabled. Set APP_ENV=development and DEMO_SEED_ENABLED=true explicitly.")

    password = required("DEMO_ACCOUNT_PASSWORD")
    if len(password.encode("utf-8")) < 10:
        raise RuntimeError("DEMO_ACCOUNT_PASSWORD must be at least 10 bytes long")

    accounts = [
        ("Demo Free User", required("DEMO_FREE_EMAIL").lower(), "user", "free"),
        ("Demo Premium User", required("DEMO_PREMIUM_EMAIL").lower(), "premium", "premium"),
        ("Demo Administrator", required("DEMO_ADMIN_EMAIL").lower(), "admin", "free"),
    ]
    if len({email for _, email, _, _ in accounts}) != 3:
        raise RuntimeError("Each demo account must use a different email address")

    db = SessionLocal()
    try:
        created = []
        for name, email, role, plan in accounts:
            user = upsert_account(db, name=name, email=email, password=password, role=role, plan=plan)
            if role == "premium":
                now = datetime.now(timezone.utc)
                active = db.query(Subscription).filter(Subscription.user_id == user.id, Subscription.status == "active", Subscription.expires_at > now).first()
                if active is None:
                    db.add(Subscription(user_id=user.id, plan="premium_demo", status="active", starts_at=now, expires_at=now + timedelta(days=365)))
            created.append((email, role))
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print("Development demo accounts are ready:")
    for email, role in created:
        print(f"- {email}: {role}")
    print("Password: the value of DEMO_ACCOUNT_PASSWORD (not printed)")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Demo seed failed: {error}", file=sys.stderr)
        raise SystemExit(1)
