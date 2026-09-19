"""
Automated Unit Test Suite for Phase 2:
- Format-Preserving Encryption (FPE) for 10-digit Phone Numbers
- AES-256-GCM Vault Encryption and Integrity Verification
- Deterministic Token Generation for Relational Integrity
- PII Discovery Engine Classification, Confidence Scoring, and Preview Masking
"""

import pytest
import base64
from app.crypto.fpe import encrypt_phone, decrypt_phone
from app.crypto.vault_crypto import (
    encrypt_vault_value,
    decrypt_vault_value,
    AuthenticationError
)
from app.crypto.tokenizer import generate_token
from app.discovery.pii_engine import scan_table_sample


# =====================================================================
# 1. Format-Preserving Encryption (FPE) Tests
# =====================================================================

def test_fpe_phone_preservation():
    """
    Verifies that:
    - Input '9876543210' encrypts to a 10-digit numeric string distinct from input.
    - Decrypting the ciphertext returns the exact original input.
    - Edge cases with leading zeros (e.g., '0123456789') preserve 10 digits and leading zeros.
    """
    phone = "9876543210"
    encrypted = encrypt_phone(phone)

    # Output assertions
    assert isinstance(encrypted, str), "Encrypted FPE output must be of type string"
    assert len(encrypted) == 10, "Encrypted FPE output must be exactly 10 digits"
    assert encrypted.isdigit(), "Encrypted FPE output must contain only digits"
    assert encrypted != phone, "Ciphertext must not be equal to plaintext"

    # Decryption roundtrip
    decrypted = decrypt_phone(encrypted)
    assert decrypted == phone, "Decrypted phone must match original input"

    # Edge case: Leading zero preservation
    leading_zero_phone = "0123456789"
    encrypted_lz = encrypt_phone(leading_zero_phone)
    assert isinstance(encrypted_lz, str)
    assert len(encrypted_lz) == 10
    assert encrypted_lz.isdigit()
    assert encrypted_lz != leading_zero_phone

    decrypted_lz = decrypt_phone(encrypted_lz)
    assert decrypted_lz == leading_zero_phone, "Decrypted phone must preserve leading zeros"


def test_fpe_phone_cleaning_and_validation():
    """
    Verifies phone normalization (spaces, hyphens, country code prefix +91)
    and invalid length rejection without exposing raw data.
    """
    # Formatted phone number with +91 prefix and hyphens
    formatted_phone = "+91-98765-43210"
    enc = encrypt_phone(formatted_phone)
    assert len(enc) == 10
    assert enc.isdigit()
    assert decrypt_phone(enc) == "9876543210"

    # Invalid phone lengths must raise ValueError
    with pytest.raises(ValueError):
        encrypt_phone("12345")  # Too short

    with pytest.raises(ValueError):
        encrypt_phone("12345678901234")  # Too long

    with pytest.raises(ValueError):
        decrypt_phone("12345")  # Invalid FPE ciphertext


# =====================================================================
# 2. Vault AES-256-GCM Encryption Tests
# =====================================================================

def test_vault_aes_gcm_roundtrip():
    """
    Verifies authenticated AES-256-GCM encryption:
    - Ciphertext is Base64 encoded and not plaintext.
    - Decryption returns exact original plaintext.
    - Modifying even a single byte in ciphertext raises AuthenticationError.
    """
    plaintext = "Confidential Customer Record #12345"
    ciphertext_b64 = encrypt_vault_value(plaintext)

    assert isinstance(ciphertext_b64, str)
    assert ciphertext_b64 != plaintext
    assert "Confidential" not in ciphertext_b64

    # Roundtrip decryption
    recovered = decrypt_vault_value(ciphertext_b64)
    assert recovered == plaintext, "Decrypted plaintext must match original"

    # Tamper check: Modify a byte in the packed payload
    raw_bytes = bytearray(base64.b64decode(ciphertext_b64))
    # Flip bits in the ciphertext portion (after 12-byte nonce)
    raw_bytes[15] ^= 0xFF
    tampered_b64 = base64.b64encode(bytes(raw_bytes)).decode("utf-8")

    with pytest.raises(AuthenticationError):
        decrypt_vault_value(tampered_b64)

    # Tamper check: Modify a byte in the 12-byte nonce
    raw_nonce_tampered = bytearray(base64.b64decode(ciphertext_b64))
    raw_nonce_tampered[2] ^= 0xFF
    tampered_nonce_b64 = base64.b64encode(bytes(raw_nonce_tampered)).decode("utf-8")

    with pytest.raises(AuthenticationError):
        decrypt_vault_value(tampered_nonce_b64)


# =====================================================================
# 3. Deterministic Token Generator Tests
# =====================================================================

def test_deterministic_tokens():
    """
    Verifies deterministic token generation:
    - Identical inputs yield identical tokens across different calls.
    - Normalization (whitespace, uppercase/lowercase) produces identical tokens.
    - Different inputs yield distinct, collision-free tokens.
    - Format strictly adheres to {PII_TYPE}_{HEX_10}.
    """
    email_1 = "test.user@example.com"
    email_2 = "TEST.USER@EXAMPLE.COM"
    email_3 = "  test.user@example.com  "
    different_email = "another.user@example.com"

    token_1 = generate_token("EMAIL", email_1)
    token_2 = generate_token("EMAIL", email_2)
    token_3 = generate_token("EMAIL", email_3)
    token_diff = generate_token("EMAIL", different_email)

    # Format checks: EMAIL_<10 hex uppercase characters>
    assert token_1.startswith("EMAIL_")
    token_suffix = token_1.split("_", 1)[1]
    assert len(token_suffix) == 10
    assert token_suffix.isupper() or token_suffix.isalnum()

    # Deterministic consistency
    assert token_1 == token_2, "Case variations must produce identical tokens"
    assert token_1 == token_3, "Whitespace variations must produce identical tokens"
    assert token_1 != token_diff, "Different emails must produce distinct tokens"

    # Name token test
    name_token = generate_token("NAME", "Aarav Sharma")
    assert name_token.startswith("NAME_")
    assert len(name_token.split("_", 1)[1]) == 10


# =====================================================================
# 4. PII Discovery & Classification Engine Tests
# =====================================================================

def test_pii_discovery():
    """
    Verifies column scanning, confidence scoring, policy suggestion,
    and masked UI previews on sample data records.
    """
    sample_data = [
        {"customer_id": "C001", "name": "Aarav Sharma", "email": "aarav.sharma1@example.com", "mobile": "9876540001", "city": "Chennai"},
        {"customer_id": "C002", "name": "Priya Nair", "email": "priya.nair2@example.com", "mobile": "9876540002", "city": "Bengaluru"},
        {"customer_id": "C003", "name": "Rajesh Iyer", "email": "rajesh.iyer3@example.com", "mobile": "9876540003", "city": "Mumbai"},
        {"customer_id": "C004", "name": "Ananya Patel", "email": "ananya.patel4@example.com", "mobile": "9876540004", "city": "Hyderabad"},
        {"customer_id": "C005", "name": "Vikram Malhotra", "email": "vikram.malhotra5@example.com", "mobile": "9876540005", "city": "Delhi"}
    ]

    scan_results = scan_table_sample(sample_data)
    results_map = {r["column_name"]: r for r in scan_results}

    # Verify phone classification
    assert "mobile" in results_map
    phone_meta = results_map["mobile"]
    assert phone_meta["detected_type"] == "PHONE_NUMBER"
    assert phone_meta["confidence"] > 0.8
    assert phone_meta["suggested_action"] == "FPE"
    assert phone_meta["masked_preview"] == "98*****001"

    # Verify email classification
    assert "email" in results_map
    email_meta = results_map["email"]
    assert email_meta["detected_type"] == "EMAIL_ADDRESS"
    assert email_meta["confidence"] > 0.8
    assert email_meta["suggested_action"] == "TOKENIZE"
    assert "@example.com" in email_meta["masked_preview"]
    assert email_meta["masked_preview"].startswith("a***@")

    # Verify name classification
    assert "name" in results_map
    name_meta = results_map["name"]
    assert name_meta["detected_type"] == "PERSON_NAME"
    assert name_meta["confidence"] > 0.8
    assert name_meta["suggested_action"] == "TOKENIZE"
    assert name_meta["masked_preview"] == "A*** S***"

    # Verify non-sensitive city classification
    assert "city" in results_map
    city_meta = results_map["city"]
    assert city_meta["detected_type"] == "NON_SENSITIVE"
    assert city_meta["suggested_action"] == "PASSTHROUGH"
    assert city_meta["masked_preview"] == "Chennai"

    # Verify non-sensitive customer_id classification
    assert "customer_id" in results_map
    id_meta = results_map["customer_id"]
    assert id_meta["detected_type"] == "NON_SENSITIVE"
    assert id_meta["suggested_action"] == "PASSTHROUGH"
    assert id_meta["masked_preview"] == "C001"
