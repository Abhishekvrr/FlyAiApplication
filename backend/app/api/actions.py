"""
Privacy Gateway Execution Router:
- Token-based Email Dispatch via SMTP (Mailpit) with Zero-Plaintext Return
- Inbound Provider Bounce Webhook Resolution via Deterministic Tokens
"""

import os
import smtplib
from email.mime.text import MIMEText
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.crypto.vault_crypto import decrypt_vault_value
from app.crypto.tokenizer import generate_token

router = APIRouter(tags=["Privacy Gateway Actions"])


class SendEmailRequest(BaseModel):
    recipient_token: Optional[str] = Field(default=None, examples=["EMAIL_8BB647195A"])
    recipient: Optional[str] = Field(default=None, examples=["EMAIL_8BB647195A"])
    campaign_id: str = Field(..., examples=["CMP_2026_SPRING"])
    template_id: str = Field(default="TPL_DEFAULT", examples=["TPL_WELCOME"])
    subject: Optional[str] = Field(default=None, examples=["Special Promotion for Premium Members"])
    message: Optional[str] = Field(default=None, examples=["Hello! Your privacy-preserving offer has arrived."])
    custom_message: Optional[str] = Field(default=None, examples=["Hello! Your privacy-preserving offer has arrived."])

    @property
    def target_token(self) -> str:
        tok = self.recipient_token or self.recipient
        if not tok:
            raise ValueError("Recipient token must be specified via recipient_token or recipient.")
        return tok.strip()


class EmailWebhookRequest(BaseModel):
    email: str = Field(..., examples=["user@example.com"])
    event: str = Field(default="BOUNCE", examples=["BOUNCE"])
    reason: Optional[str] = Field(default="MAILBOX_NOT_FOUND", examples=["MAILBOX_NOT_FOUND"])


@router.post("/actions/send-email")
@router.post("/gateway/email/send")
def send_email_action(payload: SendEmailRequest, db: Session = Depends(get_db)):
    """
    Downstream campaign email dispatching endpoint (Section 13 & 16 of PDF):
    1. Looks up recipient token in vault_store.token_vault.
    2. Decrypts plaintext destination in isolated memory.
    3. Sends SMTP email to Mailpit with custom subject and body.
    4. Records audit log.
    5. Returns confirmation without exposing resolved email.
    """
    token_to_resolve = payload.target_token

    token_query = text("""
        SELECT encrypted_original
        FROM vault_store.token_vault
        WHERE token_value = :token_value AND pii_type = 'EMAIL';
    """)
    record = db.execute(token_query, {"token_value": token_to_resolve}).mappings().first()
    if not record:
        raise HTTPException(
            status_code=404,
            detail="Recipient token not found in token vault."
        )

    try:
        # Decrypt destination email in volatile gateway memory
        decrypted_email = decrypt_vault_value(record["encrypted_original"])

        # Construct and send message via Mailpit SMTP
        smtp_host = os.getenv("SMTP_HOST", "localhost")
        smtp_port = int(os.getenv("SMTP_PORT", "1025"))

        subject_line = payload.subject.strip() if payload.subject else f"Campaign {payload.campaign_id} Notification"
        body_content = (payload.message or payload.custom_message or "").strip()
        if not body_content:
            body_content = f"Hello, this message was securely delivered via the Privacy Gateway for template {payload.template_id}."

        msg = MIMEText(body_content)
        msg["Subject"] = subject_line
        msg["From"] = "gateway@cdp.internal"
        msg["To"] = decrypted_email

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.send_message(msg)


        # Record audit log
        audit_query = text("""
            INSERT INTO audit_store.audit_logs (
                actor, role, action, purpose, reference, resource_id, outcome, timestamp
            ) VALUES (
                'Marketing_Service', 'MARKETING', 'SEND_EMAIL', 'CAMPAIGN_DELIVERY',
                :reference, :resource_id, 'SUCCESS', CURRENT_TIMESTAMP
            );
        """)
        db.execute(audit_query, {
            "reference": payload.campaign_id,
            "resource_id": token_to_resolve
        })
        db.commit()

        # Plaintext destination is strictly withheld from response payload
        return {
            "recipient": token_to_resolve,
            "recipient_token": token_to_resolve,
            "campaign_id": payload.campaign_id,
            "status": "SENT"
        }

    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to dispatch campaign email via privacy gateway."
        )


@router.post("/webhooks/email")
@router.post("/gateway/webhook/bounce")
def handle_email_webhook(payload: EmailWebhookRequest, db: Session = Depends(get_db)):
    """
    Processes incoming provider webhooks (Section 14 & 16 of PDF):
    1. Deterministically derives the token corresponding to the raw email.
    2. Updates protected_store.customers_protected with bounce metadata.
    3. Writes an immutable audit trail entry.
    """
    try:
        # Derive deterministic token without requiring full vault scans
        resolved_token = generate_token("EMAIL", payload.email)

        # Update protected store status
        update_query = text("""
            UPDATE protected_store.customers_protected
            SET bounce_status = 'BOUNCED',
                bounce_reason = :bounce_reason,
                updated_at = CURRENT_TIMESTAMP
            WHERE email_token = :email_token;
        """)
        db.execute(update_query, {
            "bounce_reason": payload.reason or "MAILBOX_NOT_FOUND",
            "email_token": resolved_token
        })

        # Write audit event
        audit_query = text("""
            INSERT INTO audit_store.audit_logs (
                actor, role, action, purpose, reference, resource_id, outcome, timestamp
            ) VALUES (
                'Email_Webhook', 'SYSTEM', 'EMAIL_BOUNCE', 'WEBHOOK_PROCESSING',
                :reference, :resource_id, 'SUCCESS', CURRENT_TIMESTAMP
            );
        """)
        db.execute(audit_query, {
            "reference": resolved_token,
            "resource_id": resolved_token
        })
        db.commit()

        return {
            "status": "PROCESSED",
            "recipient": resolved_token,
            "recipient_token": resolved_token,
            "event": payload.event.upper(),
            "reason": payload.reason or "MAILBOX_NOT_FOUND"
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to process email webhook."
        )
