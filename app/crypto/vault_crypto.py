"""
Authenticated Symmetric Encryption for Token Vault Storage using AES-256-GCM.
"""

import os
import base64
from pathlib import Path
from dotenv import load_dotenv
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

# Ensure environment variables are loaded
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env")


class AuthenticationError(Exception):
    """Raised when ciphertext integrity check or decryption fails."""
    pass


_aesgcm_instance = None


def _get_aesgcm() -> AESGCM:
    """Loads VAULT_AES_KEY, decodes base64 to 32 bytes, and returns AESGCM instance."""
    global _aesgcm_instance
    if _aesgcm_instance is not None:
        return _aesgcm_instance

    key_b64 = os.getenv("VAULT_AES_KEY")
    if not key_b64:
        raise RuntimeError("VAULT_AES_KEY environment variable is not configured.")

    try:
        key_bytes = base64.b64decode(key_b64.strip())
    except Exception:
        raise RuntimeError("VAULT_AES_KEY must be a valid base64-encoded string.")

    if len(key_bytes) != 32:
        raise RuntimeError("VAULT_AES_KEY must be exactly 32 bytes (256 bits) for AES-256-GCM.")

    _aesgcm_instance = AESGCM(key_bytes)
    return _aesgcm_instance


def encrypt_vault_value(plaintext: str) -> str:
    """
    Encrypts a plaintext string using AES-256-GCM authenticated encryption.
    Generates a cryptographically random 12-byte nonce, prepends it to the ciphertext
    (which includes the 16-byte authentication tag), and returns the packed bytes as Base64.
    """
    if not isinstance(plaintext, str):
        raise ValueError("Invalid vault plaintext: input must be a string.")

    aesgcm = _get_aesgcm()
    nonce = os.urandom(12)  # Standard 96-bit nonce for AES-GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    packed = nonce + ciphertext
    return base64.b64encode(packed).decode("utf-8")


def decrypt_vault_value(packed_ciphertext_b64: str) -> str:
    """
    Decrypts and authenticates an AES-256-GCM packed ciphertext from Base64.
    Extracts the 12-byte nonce and ciphertext, verifying the GCM authentication tag.
    Raises AuthenticationError on tampered data or authentication failure.
    Never exposes sensitive values in error messages.
    """
    if not isinstance(packed_ciphertext_b64, str):
        raise ValueError("Invalid ciphertext: input must be a base64-encoded string.")

    try:
        packed = base64.b64decode(packed_ciphertext_b64.strip())
    except Exception as e:
        raise AuthenticationError("Invalid base64 encoding in vault ciphertext.") from e

    # Minimum length: 12 bytes nonce + 16 bytes tag = 28 bytes
    if len(packed) < 28:
        raise AuthenticationError("Ciphertext payload is too short or corrupted.")

    nonce = packed[:12]
    ciphertext = packed[12:]

    aesgcm = _get_aesgcm()
    try:
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted_bytes.decode("utf-8")
    except InvalidTag as e:
        raise AuthenticationError("Vault decryption failed: authentication tag mismatch or corrupted ciphertext.") from e
    except Exception as e:
        raise AuthenticationError("Vault decryption failed due to invalid ciphertext payload.") from e
