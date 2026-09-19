"""
Deterministic Token Generator for Relational Integrity across Batch Runs.
Generates collision-resistant, pseudonymized tokens formatted as {PII_TYPE}_{HEX_10}.
"""

import os
import hmac
import hashlib
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded (check backend/.env or workspace root .env)
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if not _env_path.exists():
    _env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=_env_path)


def _get_token_secret() -> bytes:
    """
    Retrieves the pepper/secret key used for HMAC tokenization from environment variables.
    Checks TOKEN_PEPPER, TOKEN_SECRET, and falls back to VAULT_AES_KEY or FPE_KEY.
    """
    secret = os.getenv("TOKEN_PEPPER") or os.getenv("TOKEN_SECRET")
    if secret:
        return secret.strip().encode("utf-8")

    # Fallback to VAULT_AES_KEY or FPE_KEY if specific pepper is not provided
    fallback = os.getenv("VAULT_AES_KEY") or os.getenv("FPE_KEY")
    if fallback:
        return fallback.strip().encode("utf-8")

    raise RuntimeError("Deterministic token secret/pepper is not configured in environment.")


def generate_token(pii_type: str, raw_value: str) -> str:
    """
    Generates a deterministic, collision-resistant token for a given PII value.
    - Normalizes the input (stripped and lowercased).
    - Computes HMAC-SHA256 with the secret pepper.
    - Takes the first 10 hex characters in uppercase.
    - Returns formatted token: {PII_TYPE}_{HEX_10}, e.g. EMAIL_3A89F0B12D or NAME_C92E880B1A.
    - Never logs or exposes raw_value in logs or error messages.
    """
    if not isinstance(pii_type, str) or not pii_type.strip():
        raise ValueError("Invalid PII type: must be a non-empty string.")

    if not isinstance(raw_value, str):
        raise ValueError("Invalid raw value: input must be a string.")

    normalized_value = raw_value.strip().lower()
    prefix = pii_type.strip().upper()
    secret = _get_token_secret()

    digest = hmac.new(secret, normalized_value.encode("utf-8"), hashlib.sha256).hexdigest()
    hex_10 = digest[:10].upper()

    return f"{prefix}_{hex_10}"
