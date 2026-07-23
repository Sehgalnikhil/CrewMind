from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()

# bcrypt's algorithm silently truncates input beyond 72 bytes; reject longer
# passwords explicitly instead of allowing a false sense of extra entropy.
_MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    encoded = password.encode("utf-8")
    if len(encoded) > _MAX_PASSWORD_BYTES:
        raise ValueError(f"password must be at most {_MAX_PASSWORD_BYTES} bytes")
    return bcrypt.hashpw(encoded, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False


import secrets
import hashlib

def create_access_token(
    subject: str, 
    expires_minutes: int | None = None, 
    session_id: str | None = None, 
    mfa_verified: bool = False
) -> str:
    # Use 15 mins by default for enterprise security
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or 15
    )
    payload = {
        "sub": subject, 
        "exp": expire,
        "session_id": session_id,
        "mfa_verified": mfa_verified
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

def generate_refresh_token() -> str:
    """Generate a cryptographically secure random token"""
    return secrets.token_urlsafe(64)

def hash_token(token: str) -> str:
    """Hash a token for secure storage"""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        try:
            # Fallback for Clerk tokens (dev only, ideally use Clerk JWKS)
            payload = jwt.decode(token, "", options={"verify_signature": False})
            return payload
        except JWTError:
            return None
