import re
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


COMMON_WEAK_PASSWORDS = {
    "password",
    "password1",
    "password123",
    "12345678",
    "123456789",
    "qwerty123",
    "letmein1",
    "welcome1",
    "admin123",
    "iloveyou1",
    "password!",
    "p@ssw0rd",
    "passw0rd",
    "abc12345",
    "qwertyui",
}


def hash_password(
    password: str,
) -> str:

    return pwd_context.hash(
        password
    )


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:

    if not plain_password:
        return False

    if not hashed_password:
        return False

    try:

        candidate = hashed_password

        # Support older bcrypt prefixes.
        if candidate.startswith("$2y$"):
            candidate = (
                "$2b$"
                + candidate[4:]
            )

        elif candidate.startswith("$2x$"):
            candidate = (
                "$2b$"
                + candidate[4:]
            )

        return bool(
            pwd_context.verify(
                plain_password,
                candidate,
            )
        )

    except (
        ValueError,
        TypeError,
        AttributeError,
    ):
        return False


def validate_password_strength(
    password: str,
) -> None:

    if len(password) < 8:
        raise ValueError(
            "Password must be at least 8 characters long."
        )

    if not re.search(
        r"[A-Z]",
        password,
    ):
        raise ValueError(
            "Password must contain at least one uppercase letter."
        )

    if not re.search(
        r"[a-z]",
        password,
    ):
        raise ValueError(
            "Password must contain at least one lowercase letter."
        )

    if not re.search(
        r"\d",
        password,
    ):
        raise ValueError(
            "Password must contain at least one number."
        )

    if not re.search(
        r"[@$!%*?&^#_\-+=~.,;:]",
        password,
    ):
        raise ValueError(
            "Password must contain at least one special character."
        )

    if password.lower() in COMMON_WEAK_PASSWORDS:
        raise ValueError(
            "This password is too common. "
            "Please choose a stronger password."
        )


def _create_token(
    data: dict,
    expires_delta: timedelta,
    token_type: str,
) -> str:

    to_encode = data.copy()

    now = datetime.now(
        timezone.utc
    )

    to_encode.update(
        {
            "exp": now + expires_delta,
            "type": token_type,
            "iat": now,
        }
    )

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_access_token(
    data: dict,
) -> str:

    return _create_token(
        data,
        timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
        "access",
    )


def decode_token(
    token: str,
) -> dict | None:

    try:

        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[
                settings.ALGORITHM
            ],
        )

    except JWTError:
        return None


def generate_url_safe_token() -> str:
    return secrets.token_urlsafe(32)

def create_payment_session(data: dict) -> str:
    return _create_token(data, timedelta(minutes=10), "payment")


def decode_payment_session(token: str) -> dict | None:
    payload = decode_token(token)
    if not payload or payload.get("type") != "payment":
        return None
    return payload
