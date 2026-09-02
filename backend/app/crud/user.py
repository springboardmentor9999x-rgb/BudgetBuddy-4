from sqlalchemy.orm import Session

from app.models.user import User
from app.models.profile import Profile
from app.core.security import hash_password


# =========================================================
# Get User By Email
# =========================================================

def get_user_by_email(
    db: Session,
    email: str
):
    return (
        db.query(User)
        .filter(User.email == email)
        .first()
    )


# =========================================================
# Create User
# =========================================================

def create_user(
    db: Session,
    email: str,
    password: str,
    full_name: str
):
    # -------------------------
    # Create User
    # -------------------------

    user = User(
        email=email,
        hashed_password=hash_password(password),
        role="student",
        is_active=True,
        is_email_verified=False,
    )

    db.add(user)

    # Flush so user.id is generated
    # before creating the profile
    db.flush()


    # -------------------------
    # Create Profile
    # -------------------------

    profile = Profile(
        user_id=user.id,
        full_name=full_name
    )

    db.add(profile)


    # -------------------------
    # Save Both Together
    # -------------------------

    db.commit()

    db.refresh(user)

    return user