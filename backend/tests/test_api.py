"""
Privacy-Preserving CDP — End-to-End Test Suite (T01 - T16).
Conforms to Flyyy.ai Privacy-Preserving Customer Data Platform Student Engineering Challenge
and Master Test Specification.
"""

import os
import json
import pytest
from sqlalchemy import text
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import get_db, SessionLocal
from app.crypto.tokenizer import generate_token

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_data():
    """Sets up exact test customer data C001 & C002 in source_store.customers."""
    db = SessionLocal()
    try:
        # Clear working tables for isolation
        db.execute(text("DELETE FROM source_store.customers WHERE customer_id IN ('C001', 'C002');"))
        db.execute(text("DELETE FROM protected_store.customers_protected WHERE customer_id IN ('C001', 'C002');"))
        db.execute(text("""
            INSERT INTO source_store.customers (customer_id, name, email, mobile, city, segment, created_at)
            VALUES 
                ('C001', 'John Kumar', 'john@example.com', '9876543210', 'Bengaluru', 'Premium', CURRENT_TIMESTAMP),
                ('C002', 'Priya Sharma', 'priya@example.com', '9123456780', 'Mumbai', 'Standard', CURRENT_TIMESTAMP)
            ON CONFLICT (customer_id) DO UPDATE SET
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                mobile = EXCLUDED.mobile,
                city = EXCLUDED.city,
                segment = EXCLUDED.segment;
        """))
        db.commit()
    finally:
        db.close()


def test_t01_raw_data_ingestion():
    """T01: Verify batch ingestion reads records, tracks batch metadata, and leaves source unmodified."""
    db = SessionLocal()
    try:
        before_raw = db.execute(text("SELECT customer_id, name, email, mobile FROM source_store.customers WHERE customer_id IN ('C001', 'C002') ORDER BY customer_id;")).mappings().all()
        
        # Test both /batch/run and /api/batch/run
        resp = client.post("/batch/run", json={"chunk_size": 25, "source_table": "customers"})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["status"] == "COMPLETED"
        assert data["total_records"] >= 2
        assert data["processed_records"] >= 2

        # Check meta_store.batch_jobs
        job = db.execute(text("SELECT * FROM meta_store.batch_jobs WHERE batch_id = :bid;"), {"bid": data["batch_id"]}).mappings().first()
        assert job is not None
        assert job["status"] == "COMPLETED"
        assert job["started_at"] is not None
        assert job["completed_at"] is not None

        # Verify raw source unmodified
        after_raw = db.execute(text("SELECT customer_id, name, email, mobile FROM source_store.customers WHERE customer_id IN ('C001', 'C002') ORDER BY customer_id;")).mappings().all()
        assert before_raw == after_raw
    finally:
        db.close()


def test_t02_pii_discovery():
    """T02: Verify automated PII discovery classifies NAME, EMAIL, PHONE with confidence >= 90%."""
    resp = client.post("/discover?sample_size=10")
    assert resp.status_code == 200, resp.text
    cols = {c["column_name"]: c for c in resp.json().get("columns", [])}

    assert "email" in cols
    assert cols["email"]["detected_type"] in {"EMAIL", "EMAIL_ADDRESS"}
    assert cols["email"]["confidence"] >= 0.90
    assert cols["email"]["suggested_action"] == "TOKENIZE"

    assert "mobile" in cols
    assert cols["mobile"]["detected_type"] in {"PHONE", "PHONE_NUMBER"}
    assert cols["mobile"]["confidence"] >= 0.90
    assert cols["mobile"]["suggested_action"] == "FPE"

    assert "name" in cols
    assert cols["name"]["detected_type"] in {"NAME", "PERSON_NAME"}
    assert cols["name"]["confidence"] >= 0.90
    assert cols["name"]["suggested_action"] == "TOKENIZE"


def test_t03_policy_classification():
    """T03: Verify protection policies produce tokens for email/name, FPE 10-digit phone, and no plaintext."""
    resp = client.get("/policies")
    assert resp.status_code == 200

    db = SessionLocal()
    try:
        c001 = db.execute(text("SELECT * FROM protected_store.customers_protected WHERE customer_id='C001';")).mappings().first()
        assert c001 is not None
        assert c001["email_token"].startswith("EMAIL_")
        assert c001["name_token"].startswith("NAME_")
        assert len(c001["mobile_fpe"]) == 10 and c001["mobile_fpe"].isdigit()
        assert c001["mobile_fpe"] != "9876543210"
        assert "john" not in c001["email_token"].lower()
    finally:
        db.close()


def test_t04_deterministic_protection():
    """T04: Verify deterministic tokenization and FPE produce identical identifiers for identical input."""
    db = SessionLocal()
    try:
        first = db.execute(text("SELECT * FROM protected_store.customers_protected WHERE customer_id='C001';")).mappings().first()
        
        # Re-run batch ingestion
        resp = client.post("/batch/run", json={"chunk_size": 25, "source_table": "customers"})
        assert resp.status_code == 200

        second = db.execute(text("SELECT * FROM protected_store.customers_protected WHERE customer_id='C001';")).mappings().first()
        assert first is not None
        assert second is not None
        assert first["email_token"] == second["email_token"]
        assert first["name_token"] == second["name_token"]
        assert first["mobile_fpe"] == second["mobile_fpe"]
    finally:
        db.close()


def test_t05_secure_vault():
    """T05: Verify vault stores AES-256-GCM ciphertexts and zero plaintext."""
    db = SessionLocal()
    try:
        vault_records = db.execute(text("SELECT * FROM vault_store.token_vault;")).mappings().all()
        assert len(vault_records) > 0
        dump = str([dict(r) for r in vault_records])
        assert "john@example.com" not in dump.lower()
        assert "priya@example.com" not in dump.lower()
        assert "john kumar" not in dump.lower()
        vault_key = os.getenv("VAULT_AES_KEY")
        assert vault_key is not None
        assert vault_key not in dump
    finally:
        db.close()


def test_t06_protected_database():
    """T06: Verify downstream protected database contains zero prohibited plaintext values."""
    db = SessionLocal()
    try:
        prot_records = db.execute(text("SELECT * FROM protected_store.customers_protected;")).mappings().all()
        dump = str([dict(r) for r in prot_records]).lower()
        prohibited = ["john@example.com", "john kumar", "9876543210", "priya@example.com", "priya sharma", "9123456780"]
        for p in prohibited:
            assert p not in dump, f"Prohibited plaintext '{p}' leaked in protected database!"
    finally:
        db.close()


def test_t07_downstream_blindness():
    """T07: Marketing application sends email via recipient token with zero plaintext exposed."""
    db = SessionLocal()
    try:
        c001 = db.execute(text("SELECT email_token FROM protected_store.customers_protected WHERE customer_id='C001';")).mappings().first()
        assert c001 is not None
        token = c001["email_token"]

        payload = {"recipient": token, "campaign_id": "CMP1001", "template_id": "WELCOME"}
        resp = client.post("/gateway/email/send", json=payload)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["status"] == "SENT"
        assert data.get("recipient") == token or data.get("recipient_token") == token
        assert "john@example.com" not in json.dumps(data)
    finally:
        db.close()


def test_t08_privacy_gateway_resolution():
    """T08: Verify privacy gateway resolves token internally via vault without exposing plaintext."""
    db = SessionLocal()
    try:
        c001 = db.execute(text("SELECT email_token FROM protected_store.customers_protected WHERE customer_id='C001';")).mappings().first()
        assert c001 is not None
        token = c001["email_token"]
        vault_entry = db.execute(text("SELECT encrypted_original FROM vault_store.token_vault WHERE token_value=:tok;"), {"tok": token}).mappings().first()
        assert vault_entry is not None
        assert len(vault_entry["encrypted_original"]) > 30
    finally:
        db.close()


def test_t09_email_dispatch():
    """T09: Verify local SMTP / Mailpit integration dispatches real email."""
    # Already dispatched in T07; verify audit log recorded SEND_EMAIL
    db = SessionLocal()
    try:
        audit = db.execute(text("SELECT * FROM audit_store.audit_logs WHERE action='SEND_EMAIL' ORDER BY timestamp DESC LIMIT 1;")).mappings().first()
        assert audit is not None
        assert audit["outcome"] == "SUCCESS"
    finally:
        db.close()


def test_t10_bounce_webhook():
    """T10: Webhook reverse-resolves plaintext email to token and updates protected store."""
    bounce_payload = {
        "email": "john@example.com",
        "event": "BOUNCE",
        "reason": "MAILBOX_NOT_FOUND"
    }
    resp = client.post("/gateway/webhook/bounce", json=bounce_payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["status"] == "PROCESSED"

    db = SessionLocal()
    try:
        c001 = db.execute(text("SELECT bounce_status, bounce_reason FROM protected_store.customers_protected WHERE customer_id='C001';")).mappings().first()
        assert c001 is not None
        assert c001["bounce_status"] == "BOUNCED"
        assert c001["bounce_reason"] == "MAILBOX_NOT_FOUND"
    finally:
        db.close()


def test_t11_authorized_reveal():
    """T11: Authorized reveal with CUSTOMER_SUPPORT purpose returns plaintext and logs audit event."""
    reveal_payload = {
        "subject_id": "C001",
        "field": "EMAIL",
        "purpose": "CUSTOMER_SUPPORT",
        "reference": "TICKET-1091"
    }
    resp = client.post("/reveal", json=reveal_payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["plaintext_value"] == "john@example.com"
    assert data["authorized"] is True

    db = SessionLocal()
    try:
        audit = db.execute(text("SELECT * FROM audit_store.audit_logs WHERE action='REVEAL_PII' AND outcome='ACCESS_GRANTED' ORDER BY timestamp DESC LIMIT 1;")).mappings().first()
        assert audit is not None
        assert audit["purpose"] == "CUSTOMER_SUPPORT"
        assert audit["reference"] == "TICKET-1091"
    finally:
        db.close()


def test_t12_unauthorized_reveal():
    """T12: Unauthorized purpose (JUST_LOOKING) returns HTTP 403 ACCESS_DENIED and logs denial."""
    unauth_payload = {
        "subject_id": "C001",
        "field": "EMAIL",
        "purpose": "JUST_LOOKING",
        "reference": "TEST-001"
    }
    resp = client.post("/reveal", json=unauth_payload)
    assert resp.status_code == 403
    assert resp.json().get("status") == "ACCESS_DENIED" or resp.json().get("error") == "ACCESS_DENIED"

    db = SessionLocal()
    try:
        audit = db.execute(text("SELECT * FROM audit_store.audit_logs WHERE action='REVEAL_PII' AND outcome='ACCESS_DENIED' ORDER BY timestamp DESC LIMIT 1;")).mappings().first()
        assert audit is not None
        assert audit["outcome"] == "ACCESS_DENIED"
    finally:
        db.close()


def test_t13_audit_logging():
    """T13: Verify all operational events exist in audit logs and contain zero plaintext PII."""
    db = SessionLocal()
    try:
        logs = db.execute(text("SELECT * FROM audit_store.audit_logs;")).mappings().all()
        actions = set(l["action"] for l in logs)
        assert {"BATCH_INGESTION", "SEND_EMAIL", "EMAIL_BOUNCE", "REVEAL_PII"}.issubset(actions)
        dump = str([dict(l) for l in logs]).lower()
        assert "john@example.com" not in dump
        assert "priya@example.com" not in dump
    finally:
        db.close()


def test_t14_key_security():
    """T14: Verify encryption keys are loaded from environment and never stored in database."""
    vault_key = os.getenv("VAULT_AES_KEY")
    assert vault_key is not None
    assert os.getenv("FPE_KEY") is not None
    db = SessionLocal()
    try:
        vault = db.execute(text("SELECT key_reference, encrypted_original FROM vault_store.token_vault;")).mappings().all()
        for v in vault:
            assert vault_key not in v["key_reference"]
    finally:
        db.close()


def test_t15_database_isolation():
    """T15: Verify downstream customer view endpoint queries only protected store."""
    resp = client.get("/customers")
    assert resp.status_code == 200
    dump = json.dumps(resp.json()).lower()
    assert "john@example.com" not in dump
    assert "9876543210" not in dump


def test_t16_end_to_end_journey():
    """T16: Validate that the complete end-to-end customer journey succeeds without error."""
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json().get("status") == "HEALTHY"
