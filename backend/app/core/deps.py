from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.crud.user import get_user_by_email
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/login"
)


# =========================================================
# Get Current Logged-in User
# =========================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        email: str = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = get_user_by_email(
        db,
        email,
    )

    if user is None:
        raise credentials_exception

    # -----------------------------------------------------
    # Check whether account is active
    # -----------------------------------------------------

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


# =========================================================
# Role-Based Access Control
# =========================================================

def require_role(*allowed_roles):

    def role_checker(
        current_user: User = Depends(
            get_current_user
        ),
    ):

        if current_user.role not in allowed_roles:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to access this resource"
                ),
            )

        return current_user

    return role_checker


# =========================================================
# Premium User Access
# Premium + Admin
# =========================================================

def require_premium(
    current_user: User = Depends(
        get_current_user
    ),
):

    if current_user.role not in [
        "premium",
        "admin",
    ]:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium access required",
        )

    return current_user


# =========================================================
# Admin Access
# =========================================================

def require_admin(
    current_user: User = Depends(
        get_current_user
    ),
):

    if current_user.role != "admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user