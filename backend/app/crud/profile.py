from sqlalchemy.orm import Session

from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import ProfileUpdate


def get_or_create_profile(db: Session, user: User) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if profile:
        return profile
    profile = Profile(user_id=user.id)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def profile_response(user: User, profile: Profile) -> dict:
    return {"full_name": user.full_name, "email": user.email, "phone": profile.phone, "address": profile.address}


def update_profile(db: Session, user: User, profile_in: ProfileUpdate) -> dict:
    profile = get_or_create_profile(db, user)
    user.full_name = profile_in.full_name.strip()
    profile.phone = profile_in.phone.strip() if profile_in.phone else None
    profile.address = profile_in.address.strip() if profile_in.address else None
    db.commit()
    db.refresh(user)
    db.refresh(profile)
    return profile_response(user, profile)
