from sqlalchemy.orm import Session

from app.models.profile import Profile
from app.schemas.profile import ProfileUpdate


# -------------------------
# Get Profile
# -------------------------
def get_profile(
    db: Session,
    user_id: int,
):
    return (
        db.query(Profile)
        .filter(Profile.user_id == user_id)
        .first()
    )


# -------------------------
# Update Profile
# -------------------------
def update_profile(
    db: Session,
    profile: Profile,
    profile_in: ProfileUpdate,
):
    update_data = profile_in.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    return profile


# -------------------------
# Update Profile Image
# -------------------------
def update_profile_image(
    db: Session,
    profile: Profile,
    image_path: str,
):
    profile.profile_image = image_path

    db.commit()
    db.refresh(profile)

    return profile