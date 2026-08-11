import os
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt


SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set in backend/.env")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30


def hash_password(password: str):
    """Hash a password using bcrypt's standard $2b$ format."""
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        raise ValueError("Password must be at most 72 bytes long.")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
):
    """Check a plaintext password against a stored bcrypt hash."""
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > 72:
        return False
    return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))



def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
):

    to_encode = data.copy()

    if expires_delta:
        expire = (
            datetime.now(timezone.utc)
            + expires_delta
        )
    else:
        expire = (
            datetime.now(timezone.utc)
            + timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str):
    """
    Decode and verify a JWT access token.
    """

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:

        return None
