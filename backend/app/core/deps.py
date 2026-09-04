from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import ALGORITHM, SECRET_KEY
from app.crud.user import get_user_by_email
from app.models.subscription import Subscription
from datetime import datetime, timezone

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        email = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = get_user_by_email(db, email)

    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    return user


def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required")
    return current_user


def require_premium(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role == "admin":
        return current_user
    now = datetime.now(timezone.utc)
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == "active",
        Subscription.expires_at > now,
    ).order_by(Subscription.expires_at.desc()).first()
    if not subscription:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="An active Premium subscription is required")
    return current_user
