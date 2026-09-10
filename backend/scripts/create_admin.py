"""
Bootstraps (or promotes) an admin account for BudgetBuddy.

Usage (from the backend/ directory, with your venv active):
    python -m scripts.create_admin

Reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from your .env file
(see .env.example). If a user with that email already exists, it is
promoted to admin, verified, and activated instead of creating a duplicate.
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.core.security import hash_password, validate_password_strength
from app.crud.user import get_user_by_email
from app.config import settings


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        email = settings.ADMIN_EMAIL
        password = settings.ADMIN_PASSWORD
        full_name = settings.ADMIN_NAME

        try:
            validate_password_strength(password)
        except ValueError as exc:
            print(f"Refusing to create admin: ADMIN_PASSWORD in .env is weak ({exc})")
            sys.exit(1)

        existing = get_user_by_email(db, email)

        if existing:
            existing.role = "admin"
            existing.account_tier = "premium"
            existing.hashed_password = hash_password(password)
            existing.full_name = full_name
            existing.is_verified = True
            existing.is_active = True
            db.commit()
            print(f"Existing user '{email}' promoted to admin.")
            return

        admin_user = User(
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
            is_verified=True,
            is_active=True,
            role="admin",
            account_tier="premium",
        )
        db.add(admin_user)
        db.commit()
        print(f"Admin account created: {email}")
        print("You can now log in with this email and the ADMIN_PASSWORD set in your .env file.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
