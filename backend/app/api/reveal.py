"""
Auditable Reveal Router (PBAC Exception Workflow)
Allows authorized personnel under strict purpose limitation to decrypt and view raw PII.
Every attempt—authorized or denied—is immutably recorded in audit_store.audit_logs.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.crypto.fpe import decrypt_phone
from app.crypto.vault_crypto import decrypt_vault_value

router = APIRouter(tags=["Access Control & Reveal"])

# Policy-Based Access Control (PBAC) Allow Lists
ALLOWED_ROLES = {"CUSTOMER_SUPPORT", "AUDITOR", "PRIVACY_ADMIN", "ADMIN"}
DISALLOWED_ROLES = {"MARKETING", "ANALYST", "EXTERNAL_USER"}
ALLOWED_PURPOSES = {"CUSTOMER_SUPPORT", "FRAUD_INVESTIGATION", "REGULATORY_AUDIT"}
ALLOWED_FIELDS = {"PHONE", "EMAIL", "NAME"}


class RevealRequest(BaseModel):
    customer_id: Optional[str] = Field(default=None, examples=["C001"])
    subject_id: Optional[str] = Field(default=None, examples=["C001"])
    field: str = Field(..., examples=["EMAIL"])
    actor: Optional[str] = Field(default=None, examples=["agent_john"])
    role: Optional[str] = Field(default=None, examples=["CUSTOMER_SUPPORT"])
    purpose: str = Field(..., examples=["CUSTOMER_SUPPORT"])
    reference: str = Field(..., examples=["TICKET-98214"])

    @property
    def target_id(self) -> str:
        cid = self.customer_id or self.subject_id
        if not cid:
            raise ValueError("customer_id or subject_id is required.")
        return cid.strip()

    @property
    def effective_actor(self) -> str:
        return (self.actor or "support_agent").strip()

    @property
    def effective_role(self) -> str:
        if self.role and self.role.strip():
            return self.role.strip().upper()
        # Default role inference based on purpose or standard operator
        p = self.purpose.strip().upper()
        if p == "CUSTOMER_SUPPORT":
            return "CUSTOMER_SUPPORT"
        elif p in {"FRAUD_INVESTIGATION", "REGULATORY_AUDIT"}:
            return "AUDITOR"
        return "EXTERNAL_USER"


def _record_audit_event(
    db: Session,
    actor: str,
    role: str,
    action: str,
    purpose: str,
    reference: str,
    resource_id: str,
    outcome: str
):
    """Writes an immutable access audit record into audit_store.audit_logs."""
    audit_query = text("""
        INSERT INTO audit_store.audit_logs (
            actor, role, action, purpose, reference, resource_id, outcome, timestamp
        ) VALUES (
            :actor, :role, :action, :purpose, :reference, :resource_id, :outcome, CURRENT_TIMESTAMP
        );
    """)
    db.execute(audit_query, {
        "actor": actor,
        "role": role,
        "action": action,
        "purpose": purpose,
        "reference": reference,
        "resource_id": resource_id,
        "outcome": outcome
    })
    db.commit()


@router.post("/reveal")
def reveal_customer_field(payload: RevealRequest, db: Session = Depends(get_db)):
    """
    PBAC controlled reveal endpoint for authorized PII exception workflows (Section 15 & 16 of PDF):
    - Validates caller role and purpose against access policies.
    - Resolves requested field (PHONE via FPE decrypt, EMAIL/NAME via vault decrypt).
    - Logs ACCESS_GRANTED or ACCESS_DENIED immutably to audit_logs.
    """
    target_id = payload.target_id
    effective_actor = payload.effective_actor
    effective_role = payload.effective_role

    req_field = payload.field.strip().upper()
    req_role = effective_role
    req_purpose = payload.purpose.strip().upper()

    # 1. PBAC Authorization Verification
    is_role_valid = (req_role in ALLOWED_ROLES) and (req_role not in DISALLOWED_ROLES)
    is_purpose_valid = req_purpose in ALLOWED_PURPOSES
    is_field_valid = req_field in ALLOWED_FIELDS

    if not is_role_valid or not is_purpose_valid or not is_field_valid:
        # Log DENIED outcome immutably
        _record_audit_event(
            db=db,
            actor=effective_actor,
            role=effective_role,
            action="REVEAL_PII",
            purpose=payload.purpose,
            reference=payload.reference,
            resource_id=target_id,
            outcome="ACCESS_DENIED"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "status": "ACCESS_DENIED",
                "error": "ACCESS_DENIED",
                "detail": "Role or purpose not authorized for PII reveal."
            }
        )

    # 2. Retrieve customer from protected_store
    cust_query = text("""
        SELECT customer_id, name_token, email_token, mobile_fpe
        FROM protected_store.customers_protected
        WHERE customer_id = :customer_id;
    """)
    customer = db.execute(cust_query, {"customer_id": target_id}).mappings().first()

    if not customer:
        _record_audit_event(
            db=db,
            actor=effective_actor,
            role=effective_role,
            action="REVEAL_PII",
            purpose=payload.purpose,
            reference=payload.reference,
            resource_id=target_id,
            outcome="NOT_FOUND"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer ID '{target_id}' not found in protected store."
        )

    try:
        decrypted_value = ""

        if req_field == "PHONE":
            # Direct FPE decryption of mobile_fpe
            decrypted_value = decrypt_phone(customer["mobile_fpe"])

        elif req_field == "EMAIL":
            # Query vault for email_token
            vault_query = text("""
                SELECT encrypted_original
                FROM vault_store.token_vault
                WHERE token_value = :token_value AND pii_type = 'EMAIL';
            """)
            vault_record = db.execute(vault_query, {"token_value": customer["email_token"]}).mappings().first()
            if not vault_record:
                raise HTTPException(status_code=404, detail="Email token not found in vault.")
            decrypted_value = decrypt_vault_value(vault_record["encrypted_original"])

        elif req_field == "NAME":
            # Query vault for name_token
            vault_query = text("""
                SELECT encrypted_original
                FROM vault_store.token_vault
                WHERE token_value = :token_value AND pii_type = 'NAME';
            """)
            vault_record = db.execute(vault_query, {"token_value": customer["name_token"]}).mappings().first()
            if not vault_record:
                raise HTTPException(status_code=404, detail="Name token not found in vault.")
            decrypted_value = decrypt_vault_value(vault_record["encrypted_original"])

        # Record ACCESS_GRANTED audit log
        _record_audit_event(
            db=db,
            actor=effective_actor,
            role=effective_role,
            action="REVEAL_PII",
            purpose=payload.purpose,
            reference=payload.reference,
            resource_id=target_id,
            outcome="ACCESS_GRANTED"
        )

        return {
            "subject_id": target_id,
            "customer_id": target_id,
            "field": req_field,
            "plaintext_value": decrypted_value,
            "authorized": True,
            "status": "ACCESS_GRANTED"
        }

    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to decrypt customer PII."
        )
