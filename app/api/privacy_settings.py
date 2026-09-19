"""
Privacy & Security Settings Governance Router.
Exposes cryptographic key fingerprints, policy toggles, and compliance controls.
"""

import os
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/privacy", tags=["Privacy & Security Governance"])

# Default configurable privacy and security controls
PRIVACY_CONTROLS = {
    "enforce_2fa_for_reveal": True,
    "strict_gateway_mode": True,
    "auto_mask_ui_previews": True,
    "audit_logging_enabled": True,
    "data_retention_days": 90,
    "allowed_reveal_roles": ["PRIVACY_ADMIN", "CUSTOMER_SUPPORT", "AUDITOR"],
    "blocked_reveal_roles": ["MARKETING", "ANALYST", "EXTERNAL_USER"]
}


class UpdatePrivacySettingsRequest(BaseModel):
    enforce_2fa_for_reveal: Optional[bool] = Field(None, examples=[True])
    strict_gateway_mode: Optional[bool] = Field(None, examples=[True])
    auto_mask_ui_previews: Optional[bool] = Field(None, examples=[True])
    audit_logging_enabled: Optional[bool] = Field(None, examples=[True])
    data_retention_days: Optional[int] = Field(None, examples=[90])


def _mask_key(key_str: Optional[str]) -> str:
    """Masks cryptographic keys showing only first 4 and last 4 characters."""
    if not key_str or len(key_str) < 8:
        return "********"
    return f"{key_str[:4]}...{key_str[-4:]}"


@router.get("/settings")
def get_privacy_settings():
    """
    Returns system privacy parameters, cryptographic key fingerprints,
    and governance policy configurations.
    """
    fpe_key = os.getenv("FPE_KEY", "")
    vault_key = os.getenv("VAULT_AES_KEY", "")
    pepper = os.getenv("TOKEN_PEPPER", "")

    return {
        "controls": PRIVACY_CONTROLS,
        "cryptographic_fingerprints": {
            "fpe_scheme": {
                "algorithm": "Format-Preserving Encryption (FF1 Radix-10)",
                "key_fingerprint": _mask_key(fpe_key),
                "key_length": "256-bit AES cipher key",
                "format_rule": "Strict 10 numeric digits with zero-padding"
            },
            "vault_scheme": {
                "algorithm": "AES-256-GCM (Authenticated Encryption with Associated Data)",
                "key_fingerprint": _mask_key(vault_key),
                "key_length": "256 bits (32 bytes)",
                "nonce_size": "96-bit random nonce per record",
                "tag_size": "128-bit authentication tag"
            },
            "token_scheme": {
                "algorithm": "HMAC-SHA256 Deterministic Pseudonymization",
                "pepper_fingerprint": _mask_key(pepper),
                "token_format": "{PII_TYPE}_{HEX_10}"
            }
        },
        "schema_isolation": {
            "source_store": "Read-only ingestion account (SELECT only)",
            "protected_store": "De-identified store for all consumer systems",
            "vault_store": "Cryptographically isolated, strictly gateway-internal",
            "audit_store": "Immutable append-only operational audit log"
        }
    }


@router.post("/settings")
def update_privacy_settings(payload: UpdatePrivacySettingsRequest):
    """Updates system privacy governance controls."""
    if payload.enforce_2fa_for_reveal is not None:
        PRIVACY_CONTROLS["enforce_2fa_for_reveal"] = payload.enforce_2fa_for_reveal
    if payload.strict_gateway_mode is not None:
        PRIVACY_CONTROLS["strict_gateway_mode"] = payload.strict_gateway_mode
    if payload.auto_mask_ui_previews is not None:
        PRIVACY_CONTROLS["auto_mask_ui_previews"] = payload.auto_mask_ui_previews
    if payload.audit_logging_enabled is not None:
        PRIVACY_CONTROLS["audit_logging_enabled"] = payload.audit_logging_enabled
    if payload.data_retention_days is not None:
        PRIVACY_CONTROLS["data_retention_days"] = payload.data_retention_days

    return {
        "status": "UPDATED",
        "controls": PRIVACY_CONTROLS
    }
