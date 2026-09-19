"""
Format-Preserving Encryption (FPE) Module for Phone Numbers
Preserves strictly 10 numeric digits using the FF1/FFX scheme via pyffx.
"""

import os
import re
import pyffx
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env")

# Ensure pyffx.Integer supports keyword arguments (key, radix)
_orig_integer_init = pyffx.Integer.__init__

def _patched_integer_init(self, ffx=None, length=None, key=None, radix=10, **kwargs):
    actual_key = ffx if ffx is not None else key
    if actual_key is None:
        raise TypeError("Integer cipher requires 'key' or 'ffx' argument")
    if length is None:
        raise TypeError("Integer cipher requires 'length' argument")
    _orig_integer_init(self, actual_key, length, **kwargs)

pyffx.Integer.__init__ = _patched_integer_init

_cipher_instance = None


def _get_cipher() -> pyffx.Integer:
    """Initializes and caches the pyffx Integer cipher using FPE_KEY."""
    global _cipher_instance
    if _cipher_instance is not None:
        return _cipher_instance

    fpe_key_hex = os.getenv("FPE_KEY")
    if not fpe_key_hex:
        raise RuntimeError("FPE_KEY environment variable is not configured.")

    try:
        fpe_key = bytes.fromhex(fpe_key_hex.strip())
    except ValueError:
        raise RuntimeError("FPE_KEY must be a valid hex-encoded byte string.")

    # Configure pyffx.Integer with radix=10 and length=10
    _cipher_instance = pyffx.Integer(key=fpe_key, radix=10, length=10)
    return _cipher_instance


def _clean_phone_digits(phone_str: str) -> str:
    """
    Extracts strictly 10 digits from raw phone input, stripping country codes
    (e.g., +91, 91 prefix for 12 digits, or leading trunk 0 for 11 digits),
    hyphens, spaces, and formatting characters.
    Never logs or exposes sensitive phone inputs in exception messages.
    """
    if not isinstance(phone_str, str):
        raise ValueError("Invalid phone format: input must be a string.")

    digits = re.sub(r"\D", "", phone_str)

    # Normalize 12-digit numbers with Indian prefix '91'
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    # Normalize 11-digit numbers with leading trunk zero '0'
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]

    if len(digits) != 10:
        raise ValueError("Invalid phone number: expected exactly 10 digits after normalization.")

    return digits


def encrypt_phone(phone_str: str) -> str:
    """
    Encrypts a 10-digit phone number using Format-Preserving Encryption.
    Output is strictly formatted as a 10-digit string with zero-padding if necessary.
    """
    cleaned = _clean_phone_digits(phone_str)
    cipher = _get_cipher()
    enc_int = cipher.encrypt(int(cleaned))
    return f"{enc_int:010d}"


def decrypt_phone(fpe_str: str) -> str:
    """
    Decrypts an FPE-encrypted 10-digit string back to the original 10-digit phone number.
    """
    if not isinstance(fpe_str, str):
        raise ValueError("Invalid FPE ciphertext: input must be a string.")

    digits = re.sub(r"\D", "", fpe_str)
    if len(digits) != 10:
        raise ValueError("Invalid FPE ciphertext: expected exactly 10 numeric digits.")

    cipher = _get_cipher()
    dec_int = cipher.decrypt(int(digits))
    return f"{dec_int:010d}"
