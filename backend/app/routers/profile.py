from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileResponse
from app.crud.profile import create_profile, get_profile, update_profile

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.post("/", response_model=ProfileResponse)
def add_profile(
    profile: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    existing = get_profile(db, current_user.id)

    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")

    current_user.phone_number = profile.phone_number
    db.commit()

    return create_profile(
        db,
        current_user.id,
        profile.full_name,
        profile.monthly_income,
        profile.currency,
        profile.phone_number,
    )


@router.get("/", response_model=ProfileResponse)
def read_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    profile = get_profile(db, current_user.id)

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


@router.put("/", response_model=ProfileResponse)
def edit_profile(
    profile: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db_profile = get_profile(db, current_user.id)

    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    current_user.phone_number = profile.phone_number
    db.commit()

    return update_profile(
        db,
        db_profile,
        profile.full_name,
        profile.monthly_income,
        profile.currency,
        profile.phone_number,
    )
