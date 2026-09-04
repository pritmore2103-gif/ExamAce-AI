import os
from datetime import datetime, timedelta, timezone
from hashlib import sha256

import bcrypt
from jose import JWTError, jwt


SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not configured.")


def hash_password(password: str) -> str:
    """Hash a new password using bcrypt."""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def is_legacy_password_hash(hashed: str) -> bool:
    """Return True for the old SHA-256 password format."""
    return len(hashed) == 64 and all(
        character in "0123456789abcdef"
        for character in hashed.lower()
    )


def verify_password(password: str, hashed: str) -> bool:
    """Verify bcrypt passwords and transparently support old SHA-256 hashes."""
    if not hashed:
        return False

    # Legacy ExamAce passwords were SHA-256 hex digests.
    if is_legacy_password_hash(hashed):
        return sha256(password.encode("utf-8")).hexdigest() == hashed

    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            hashed.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
) -> str:
    """Create a signed JWT with an expiration time."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT. Raises JWTError for invalid/expired tokens."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise
