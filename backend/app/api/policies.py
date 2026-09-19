"""
Protection Policies and Controlled Sandbox Protection Router.
Implements:
- POST /api/protect: Protect a supplied value for controlled testing (Table 16)
- GET /api/policies: Retrieve active protection policies
- POST /api/policies: Update field protection policies
- GET /api/source/customers: Read-only sample of raw source data for comparison
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.crypto.fpe import encrypt_phone
from app.crypto.tokenizer import generate_token
from app.crypto.vault_crypto import encrypt_vault_value

router = APIRouter(tags=["Policies & Sandbox"])

# In-memory / default policy configuration
DEFAULT_POLICIES = {
    "mobile": {"action": "FPE", "type": "PHONE_NUMBER", "description": "Format-Preserving Encryption (FF1 Radix-10)"},
    "email": {"action": "TOKENIZE", "type": "EMAIL_ADDRESS", "description": "Deterministic HMAC-SHA256 Tokenization"},
    "name": {"action": "TOKENIZE", "type": "PERSON_NAME", "description": "Deterministic HMAC-SHA256 Tokenization"},
    "city": {"action": "PASSTHROUGH", "type": "NON_SENSITIVE", "description": "Direct passthrough for BI analytics"},
    "segment": {"action": "PASSTHROUGH", "type": "NON_SENSITIVE", "description": "Direct passthrough for BI analytics"},
    "customer_id": {"action": "PASSTHROUGH", "type": "NON_SENSITIVE", "description": "Primary business identifier"}
}

ACTIVE_POLICIES = dict(DEFAULT_POLICIES)


class ProtectSandboxRequest(BaseModel):
    value: str = Field(..., examples=["9876543210", "alice@example.com"])
    policy: str = Field(..., examples=["FPE", "TOKENIZE", "ENCRYPT", "MASK"])
    pii_type: str = Field(default="GENERAL", examples=["PHONE", "EMAIL", "NAME"])


class UpdatePoliciesRequest(BaseModel):
    policies: Dict[str, Dict[str, str]]


@router.get("/policies")
def get_policies():
    """Returns currently configured data-protection policies per field."""
    return {"policies": ACTIVE_POLICIES}


@router.post("/policies")
def update_policies(payload: UpdatePoliciesRequest):
    """Updates active field-level protection policies."""
    global ACTIVE_POLICIES
    ACTIVE_POLICIES.update(payload.policies)
    return {"status": "UPDATED", "policies": ACTIVE_POLICIES}


@router.post("/protect")
def protect_value_sandbox(payload: ProtectSandboxRequest):
    """
    POST /api/protect: Protects a user-supplied value for controlled sandbox testing.
    Demonstrates FPE, Tokenization, Vault Encryption, and Masking on demand.
    """
    val = payload.value.strip()
    policy = payload.policy.strip().upper()
    ptype = payload.pii_type.strip().upper()

    try:
        protected_val = ""
        format_preserved = False

        if policy == "FPE":
            protected_val = encrypt_phone(val)
            format_preserved = (len(protected_val) == len(val) and protected_val.isdigit())

        elif policy == "TOKENIZE":
            token_prefix = ptype if ptype in {"EMAIL", "NAME", "PHONE"} else "TOKEN"
            protected_val = generate_token(token_prefix, val)
            format_preserved = False

        elif policy == "ENCRYPT":
            protected_val = encrypt_vault_value(val)
            format_preserved = False

        elif policy == "MASK":
            if "@" in val:
                u, d = val.split("@", 1)
                protected_val = f"{u[:1]}***@{d}"
            elif len(val) == 10 and val.isdigit():
                protected_val = f"{val[:2]}*****{val[-3:]}"
            else:
                protected_val = f"{val[:2]}***{val[-2:]}" if len(val) > 4 else "***"
            format_preserved = False

        else:
            protected_val = val
            format_preserved = True

        return {
            "input_value": val,
            "policy_applied": policy,
            "pii_type": ptype,
            "protected_value": protected_val,
            "input_length": len(val),
            "output_length": len(protected_val),
            "format_preserved": format_preserved,
            "is_reversible_via_vault": policy in {"FPE", "TOKENIZE", "ENCRYPT"}
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Protection failed: {str(e)}"
        )


@router.get("/source/customers")
def get_source_customers(limit: int = 50, db: Session = Depends(get_db)):
    """
    Queries read-only sample from source_store.customers.
    Demonstrates the original raw database before batch de-identification.
    """
    try:
        query = text("""
            SELECT customer_id, name, email, mobile, city, segment, created_at
            FROM source_store.customers
            ORDER BY customer_id
            LIMIT :limit;
        """)
        rows = db.execute(query, {"limit": limit}).mappings().all()
        return [dict(r) for r in rows]
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch source customer records.")


class CreateCustomerRequest(BaseModel):
    customer_id: Optional[str] = None
    name: str = Field(..., examples=["Aarav Sharma"])
    email: str = Field(..., examples=["aarav.sharma@example.com"])
    mobile: str = Field(..., examples=["9876541111"])
    city: str = Field(default="Bengaluru", examples=["Bengaluru", "Mumbai", "Delhi"])
    segment: str = Field(default="Premium", examples=["Premium", "Standard", "Enterprise"])
    auto_protect: bool = Field(default=True)


@router.post("/source/customers")
def create_source_customer(payload: CreateCustomerRequest, db: Session = Depends(get_db)):
    """
    POST /api/source/customers: Inserts a new customer into source_store.customers.
    If auto_protect=True, immediately applies FPE (10-digit phone), deterministic tokenization,
    and AES-256-GCM vault encryption, syncing to protected_store.customers_protected.
    """
    raw_name = payload.name.strip()
    raw_email = payload.email.strip().lower()
    raw_mobile = "".join(filter(str.isdigit, payload.mobile.strip()))
    city = payload.city.strip()
    segment = payload.segment.strip()

    if len(raw_mobile) != 10:
        raise HTTPException(
            status_code=400,
            detail="Invalid mobile number. Mobile number must contain exactly 10 digits for FF1 Radix-10 FPE compliance."
        )
    if "@" not in raw_email:
        raise HTTPException(status_code=400, detail="Invalid email address.")

    try:
        # Determine customer_id if not provided
        cid = payload.customer_id.strip() if payload.customer_id else None
        if not cid:
            count = db.execute(text("SELECT COUNT(*) FROM source_store.customers;")).scalar() or 0
            cid = f"C{count + 1:03d}"
            # Ensure unique
            existing = db.execute(text("SELECT customer_id FROM source_store.customers WHERE customer_id = :cid;"), {"cid": cid}).scalar()
            if existing:
                import uuid
                cid = f"C{uuid.uuid4().hex[:4].upper()}"

        # Insert into source_store.customers
        insert_source = text("""
            INSERT INTO source_store.customers (customer_id, name, email, mobile, city, segment, created_at)
            VALUES (:cid, :name, :email, :mobile, :city, :segment, CURRENT_TIMESTAMP)
            ON CONFLICT (customer_id) DO UPDATE SET
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                mobile = EXCLUDED.mobile,
                city = EXCLUDED.city,
                segment = EXCLUDED.segment;
        """)
        db.execute(insert_source, {
            "cid": cid,
            "name": raw_name,
            "email": raw_email,
            "mobile": raw_mobile,
            "city": city,
            "segment": segment
        })

        protected_preview = None

        if payload.auto_protect:
            import uuid
            # 1. Format-Preserving Encryption for phone
            mobile_fpe = encrypt_phone(raw_mobile)

            # 2. Deterministic Tokens
            email_token = generate_token("EMAIL", raw_email)
            name_token = generate_token("NAME", raw_name)

            # 3. Vault Encryption
            enc_email = encrypt_vault_value(raw_email)
            enc_name = encrypt_vault_value(raw_name)

            # 4. Insert into vault_store.token_vault
            vault_insert = text("""
                INSERT INTO vault_store.token_vault (
                    token_id, token_value, encrypted_original, pii_type, key_reference, created_at
                ) VALUES
                    (:email_tid, :email_token, :enc_email, 'EMAIL', 'VAULT_AES_KEY', CURRENT_TIMESTAMP),
                    (:name_tid, :name_token, :enc_name, 'NAME', 'VAULT_AES_KEY', CURRENT_TIMESTAMP)
                ON CONFLICT (token_value) DO NOTHING;
            """)
            db.execute(vault_insert, {
                "email_tid": uuid.uuid4().hex,
                "email_token": email_token,
                "enc_email": enc_email,
                "name_tid": uuid.uuid4().hex,
                "name_token": name_token,
                "enc_name": enc_name
            })

            # 5. Upsert into protected_store.customers_protected
            protected_upsert = text("""
                INSERT INTO protected_store.customers_protected (
                    customer_id, name_token, email_token, mobile_fpe, city, segment, bounce_status, updated_at
                ) VALUES (
                    :cid, :name_token, :email_token, :mobile_fpe, :city, :segment, 'CLEAN', CURRENT_TIMESTAMP
                )
                ON CONFLICT (customer_id) DO UPDATE SET
                    name_token = EXCLUDED.name_token,
                    email_token = EXCLUDED.email_token,
                    mobile_fpe = EXCLUDED.mobile_fpe,
                    city = EXCLUDED.city,
                    segment = EXCLUDED.segment,
                    updated_at = CURRENT_TIMESTAMP;
            """)
            db.execute(protected_upsert, {
                "cid": cid,
                "name_token": name_token,
                "email_token": email_token,
                "mobile_fpe": mobile_fpe,
                "city": city,
                "segment": segment
            })

            protected_preview = {
                "customer_id": cid,
                "name_token": name_token,
                "email_token": email_token,
                "mobile_fpe": mobile_fpe,
                "city": city,
                "segment": segment,
                "bounce_status": "CLEAN"
            }

        db.commit()

        return {
            "status": "CREATED",
            "source_record": {
                "customer_id": cid,
                "name": raw_name,
                "email": raw_email,
                "mobile": raw_mobile,
                "city": city,
                "segment": segment
            },
            "protected_preview": protected_preview,
            "auto_protected": payload.auto_protect
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create customer: {str(e)}")

