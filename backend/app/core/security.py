import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext


# ============================================
# SECURITY CONFIGURATION
# ============================================

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30


# ============================================
# PASSWORD HASHING
# ============================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str):
    """
    Hash the user's password before storing it
    in the database.
    """
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
):
    """
    Check whether the entered password matches
    the hashed password stored in the database.
    """
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# ============================================
# CREATE ACCESS TOKEN
# ============================================

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
):
    """
    Create JWT access token.
    """

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


# ============================================
# VERIFY / DECODE ACCESS TOKEN
# ============================================

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