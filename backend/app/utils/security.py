# app/utils/security.py
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from app.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash of a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Generate a JWT token signed with HMAC SHA256."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def hash_reset_token(token: str) -> str:
    """Generate SHA-256 hex digest of a raw reset token."""
    import hashlib
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_password_reset_token() -> tuple[str, str]:
    """
    Generate a cryptographically secure 32-byte URL-safe reset token and its SHA-256 hash.
    Returns:
        (raw_token, token_hash)
    """
    import secrets
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_reset_token(raw_token)
    return raw_token, token_hash

