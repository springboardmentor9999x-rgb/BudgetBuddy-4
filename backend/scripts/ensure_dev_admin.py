"""Safely create or reset one development administrator account."""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.profile import Profile
from app.models.user import User


def main():
    if os.getenv("APP_ENV", "").strip().lower() not in {"development", "dev", "test"}:
        raise RuntimeError("Admin provisioning is available only in development/test environments")
    email = os.getenv("BUDGETBUDDY_ADMIN_EMAIL", "admin@budgetbuddy.dev").strip().lower()
    password = os.getenv("BUDGETBUDDY_ADMIN_PASSWORD", "")
    if len(password.encode("utf-8")) < 12:
        raise RuntimeError("Set BUDGETBUDDY_ADMIN_PASSWORD to a password of at least 12 bytes")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None and email == "admin@budgetbuddy.dev":
            user = db.query(User).filter(User.email == "admin@budgetbuddy.test", User.role == "admin").first()
        action = "updated"
        if user is None:
            user = User(full_name="BudgetBuddy Administrator", email=email, password=hash_password(password), is_verified=True)
            db.add(user)
            db.flush()
            db.add(Profile(user_id=user.id))
            action = "created"
        else:
            user.email = email
        if action == "updated":
            user.password = hash_password(password)
        user.role = "admin"
        user.plan = "free"
        user.is_verified = True
        user.is_active = True
        db.commit()
        print(f"Development administrator {action}: {email}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Admin provisioning failed: {error}", file=sys.stderr)
        raise SystemExit(1)
