from sqlalchemy.orm import Session

from app.models.profile import Profile


def create_profile(db: Session, user_id: int, full_name: str,
                    monthly_income: float, currency: str, phone_number: str | None = None):
    profile = Profile(
        user_id=user_id,
        full_name=full_name,
        monthly_income=monthly_income,
        currency=currency,
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


def get_profile(db: Session, user_id: int):
    return db.query(Profile).filter(Profile.user_id == user_id).first()


def update_profile(db: Session, profile: Profile,
                    full_name: str, monthly_income: float, currency: str, phone_number: str | None = None):
    profile.full_name = full_name
    profile.monthly_income = monthly_income
    profile.currency = currency

    db.commit()
    db.refresh(profile)

    return profile
