from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.profile import get_or_create_profile, profile_response, update_profile
from app.database import get_db
from app.models.user import User
from app.schemas.profile import ProfileOut, ProfileUpdate

router = APIRouter()


@router.get("/me", response_model=ProfileOut)
def read_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return profile_response(current_user, get_or_create_profile(db, current_user))


@router.put("/me", response_model=ProfileOut)
def edit_profile(profile_in: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_profile(db, current_user, profile_in)
