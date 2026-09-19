"""
PII Discovery & Column Profiling Engine.
Analyzes column samples to detect PII types (PHONE_NUMBER, EMAIL_ADDRESS, PERSON_NAME, NON_SENSITIVE),
calculates statistical confidence scores, suggests protection policies (FPE, TOKENIZE, PASSTHROUGH),
and generates masked UI previews.
"""

import re
from typing import List, Dict, Any, Optional

# Compiled regex patterns for high-precision PII detection
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
)

# Common Indian/international 10-digit mobile number formats
PHONE_REGEX = re.compile(
    r"^(\+?91[\-\s]?)?[6-9]\d{9}$|^(\+?\d{1,3}[\-\s]?)?\d{10}$"
)

# Person name heuristic: 1-4 words with letters, hyphens, apostrophes (no digits or symbols)
NAME_VALUE_REGEX = re.compile(
    r"^[A-Z][a-zA-Z]*(?:[\s\'-][A-Z][a-zA-Z]*)+$"
)

# Column name hint keywords
PHONE_COL_HINTS = {"phone", "mobile", "contact", "cell", "tel", "phonenumber", "mobile_number"}
EMAIL_COL_HINTS = {"email", "mail", "email_address", "emailaddress"}
NAME_COL_HINTS = {"name", "full_name", "first_name", "last_name", "fname", "lname", "customer_name"}
NON_SENSITIVE_HINTS = {
    "city", "state", "country", "zip", "postal", "segment", "status", "id", "customer_id",
    "created_at", "updated_at", "timestamp", "date", "reason", "bounce_status", "bounce_reason"
}


def _is_phone_value(val: str, col_name: str) -> bool:
    """Checks if a value matches phone number patterns and heuristics."""
    clean = re.sub(r"\D", "", val)
    # Check if raw string matches phone pattern
    if PHONE_REGEX.match(val):
        return True
    # If 10 digits or 12 digits starting with 91, and column hints phone or purely numeric
    if len(clean) == 10:
        if any(h in col_name.lower() for h in PHONE_COL_HINTS) or clean[0] in "6789":
            return True
    if len(clean) == 12 and clean.startswith("91"):
        return True
    return False


def _is_email_value(val: str) -> bool:
    """Checks if a value matches RFC email syntax."""
    return bool(EMAIL_REGEX.match(val.strip()))


def _is_name_value(val: str, col_name: str) -> bool:
    """Checks if a value represents a person name."""
    clean = val.strip()
    col_lower = col_name.lower()

    # If column is explicitly in non-sensitive hints, don't classify as person name
    if col_lower in NON_SENSITIVE_HINTS:
        return False

    # Check for multi-word alphabetic names
    if NAME_VALUE_REGEX.match(clean):
        return True

    # If column name strongly indicates name and value is alphabetic (2 or more words)
    if any(h in col_lower for h in NAME_COL_HINTS) and col_lower not in {"column_name", "filename", "table_name"}:
        words = clean.split()
        if 1 <= len(words) <= 4 and all(w.replace("-", "").replace("'", "").isalpha() for w in words):
            return True

    return False


def _mask_preview(pii_type: str, raw_val: str) -> str:
    """
    Generates a masked preview string for UI presentation without exposing sensitive data.
    e.g.:
      - Email: j***@example.com
      - Phone: 98*****210
      - Name:  A*** S***
      - Non-sensitive: direct preview
    """
    if not raw_val:
        return ""

    val = raw_val.strip()

    if pii_type == "EMAIL_ADDRESS":
        if "@" in val:
            local_part, domain = val.split("@", 1)
            first_char = local_part[0] if local_part else ""
            return f"{first_char}***@{domain}"
        return f"{val[:1]}***"

    elif pii_type == "PHONE_NUMBER":
        digits = re.sub(r"\D", "", val)
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        elif len(digits) == 11 and digits.startswith("0"):
            digits = digits[1:]

        if len(digits) == 10:
            # 2 visible, 5 asterisks, 3 visible = 98*****210
            return f"{digits[:2]}*****{digits[-3:]}"
        elif len(val) >= 4:
            return f"{val[:2]}*****{val[-2:]}"
        return "*****"

    elif pii_type == "PERSON_NAME":
        words = val.split()
        if words:
            masked_words = [f"{w[0]}***" if len(w) > 0 else "*" for w in words]
            return " ".join(masked_words)
        return f"{val[:1]}***"

    else:
        # Non-sensitive: display sample as-is (up to 30 chars)
        return val if len(val) <= 30 else f"{val[:27]}..."


def scan_table_sample(sample_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Profiles and classifies column samples across table records.
    Returns structured column classification metadata:
    {
        "column_name": str,
        "detected_type": str,        # PHONE_NUMBER, EMAIL_ADDRESS, PERSON_NAME, NON_SENSITIVE
        "confidence": float,         # 0.0 to 1.0
        "suggested_action": str,     # FPE, TOKENIZE, PASSTHROUGH
        "masked_preview": str        # Masked representation for UI
    }
    """
    if not sample_records:
        return []

    # Identify all distinct column names maintaining order
    columns = []
    for record in sample_records:
        for col in record.keys():
            if col not in columns:
                columns.append(col)

    results = []

    for col in columns:
        col_lower = col.lower()
        values = [
            str(r[col]).strip()
            for r in sample_records
            if col in r and r[col] is not None and str(r[col]).strip() != ""
        ]

        total_values = len(values)
        if total_values == 0:
            results.append({
                "column_name": col,
                "detected_type": "NON_SENSITIVE",
                "confidence": 0.0,
                "suggested_action": "PASSTHROUGH",
                "masked_preview": ""
            })
            continue

        first_sample = values[0]

        # Check explicit non-sensitive columns
        if col_lower in NON_SENSITIVE_HINTS:
            results.append({
                "column_name": col,
                "detected_type": "NON_SENSITIVE",
                "confidence": 1.0,
                "suggested_action": "PASSTHROUGH",
                "masked_preview": _mask_preview("NON_SENSITIVE", first_sample)
            })
            continue

        # Count matches for each candidate PII type
        phone_matches = sum(1 for v in values if _is_phone_value(v, col))
        email_matches = sum(1 for v in values if _is_email_value(v))
        name_matches = sum(1 for v in values if _is_name_value(v, col))

        phone_ratio = phone_matches / total_values
        email_ratio = email_matches / total_values
        name_ratio = name_matches / total_values

        # Determine best classification with confidence threshold
        if phone_ratio >= 0.7:
            detected_type = "PHONE_NUMBER"
            confidence = round(phone_ratio, 2)
            suggested_action = "FPE"
        elif email_ratio >= 0.7:
            detected_type = "EMAIL_ADDRESS"
            confidence = round(email_ratio, 2)
            suggested_action = "TOKENIZE"
        elif name_ratio >= 0.7:
            detected_type = "PERSON_NAME"
            confidence = round(name_ratio, 2)
            suggested_action = "TOKENIZE"
        else:
            detected_type = "NON_SENSITIVE"
            confidence = 1.0
            suggested_action = "PASSTHROUGH"

        masked_preview = _mask_preview(detected_type, first_sample)

        results.append({
            "column_name": col,
            "detected_type": detected_type,
            "confidence": confidence,
            "suggested_action": suggested_action,
            "masked_preview": masked_preview
        })

    return results
