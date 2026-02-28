import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── Password Hashing ─────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ─── JWT ──────────────────────────────────────────────────────────────────────

def create_access_token(subject: str, role: str, tenant_id: str) -> str:
    """Create a signed JWT for agency staff."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "role": role,
        "tenant_id": tenant_id,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT. Raises JWTError on failure."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


# ─── UUID Client Tokens ────────────────────────────────────────────────────────

def generate_client_token() -> str:
    """Generate a cryptographically random UUID token for client access."""
    return str(uuid.uuid4())


# ─── AES-256-GCM Encryption ───────────────────────────────────────────────────

def encrypt_credential(plaintext: str) -> str:
    """
    Encrypt with AES-256-GCM.
    Storage format: hex(nonce_12_bytes) + hex(ciphertext_with_tag)
    The nonce is fresh per encryption — same plaintext → different ciphertext every time.
    """
    aesgcm = AESGCM(settings.aes_key_bytes)
    nonce = os.urandom(12)  # 96-bit nonce, required for GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return nonce.hex() + ciphertext.hex()


def decrypt_credential(encrypted_hex: str) -> str:
    """
    Decrypt a string encrypted with encrypt_credential().
    First 24 hex chars = 12-byte nonce; remainder = ciphertext + GCM tag.
    Raises InvalidTag if data was tampered with.
    """
    nonce = bytes.fromhex(encrypted_hex[:24])
    ciphertext = bytes.fromhex(encrypted_hex[24:])
    aesgcm = AESGCM(settings.aes_key_bytes)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")
