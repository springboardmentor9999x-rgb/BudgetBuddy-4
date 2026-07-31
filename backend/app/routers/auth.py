from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.auth import (
    Signup,
    Login,
    ResetPassword
)

from app.crud.user import (
    create_user,
    get_user_by_email
)

from app.core.security import (
    verify_password,
    create_access_token,
    hash_password
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================
# SIGNUP
# =========================

@router.post("/signup")
def signup(
    user: Signup,
    db: Session = Depends(get_db)
):

    existing = get_user_by_email(
        db,
        user.email
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    create_user(db, user)

    return {
        "message": "User created successfully"
    }


# =========================
# LOGIN
# =========================

@router.post("/login")
def login(
    user: Login,
    db: Session = Depends(get_db)
):

    db_user = get_user_by_email(
        db,
        user.email
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not verify_password(
        user.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_access_token(
        {
            "sub": db_user.email
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# =========================
# RESET PASSWORD
# =========================

@router.post("/reset-password")
def reset_password(
    data: ResetPassword,
    db: Session = Depends(get_db)
):

    user = get_user_by_email(
        db,
        data.email
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email is not registered"
        )

    user.password = hash_password(
        data.new_password
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "Password reset successfully"
    }