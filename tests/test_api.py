"""
Automated Integration Test Suite for Phase 3:
FastAPI Privacy Gateway, Batch Pipeline, Email Execution, Bounce Webhook, and PBAC Reveal API.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_and_root():
    """Verify health and root endpoints."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "HEALTHY"

    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["platform"] == "Enterprise Privacy-Preserving CDP"


def test_pii_discovery():
    """Verify POST /api/discover profiles source_store.customers samples."""
    resp = client.post("/api/discover?sample_size=20")
    assert resp.status_code == 200
    data = resp.json()
    assert "columns" in data
    assert data["sample_count"] > 0

    col_map = {c["column_name"]: c for c in data["columns"]}
    assert "mobile" in col_map
    assert col_map["mobile"]["detected_type"] == "PHONE_NUMBER"
    assert col_map["mobile"]["suggested_action"] == "FPE"
    assert col_map["mobile"]["confidence"] >= 0.7

    assert "email" in col_map
    assert col_map["email"]["detected_type"] == "EMAIL_ADDRESS"
    assert col_map["email"]["suggested_action"] == "TOKENIZE"

    assert "name" in col_map
    assert col_map["name"]["detected_type"] == "PERSON_NAME"
    assert col_map["name"]["suggested_action"] == "TOKENIZE"


def test_batch_ingestion_and_protected_views():
    """
    Verify POST /api/batch/run processes 50 source customers into protected_store,
    and GET /api/customers serves strictly de-identified records.
    """
    # 1. Run batch pipeline
    batch_resp = client.post("/api/batch/run", json={"chunk_size": 25, "source_table": "customers"})
    assert batch_resp.status_code == 200
    batch_data = batch_resp.json()
    assert batch_data["status"] == "COMPLETED"
    assert batch_data["processed_records"] >= 50
    assert batch_data["error_records"] == 0
    batch_id = batch_data["batch_id"]


    # 2. Query batch job details
    get_batch_resp = client.get(f"/api/batch/{batch_id}")
    assert get_batch_resp.status_code == 200
    assert get_batch_resp.json()["status"] == "COMPLETED"

    # 3. Query historical batch jobs
    list_batch_resp = client.get("/api/batch")
    assert list_batch_resp.status_code == 200
    assert len(list_batch_resp.json()) >= 1

    # 4. Query protected customers
    cust_resp = client.get("/api/customers?limit=100")
    assert cust_resp.status_code == 200
    cust_data = cust_resp.json()
    assert cust_data["total"] >= 50
    assert len(cust_data["customers"]) >= 50


    # Ensure all customer records are de-identified
    for cust in cust_data["customers"]:
        assert cust["email_token"].startswith("EMAIL_")
        assert cust["name_token"].startswith("NAME_")
        assert len(cust["mobile_fpe"]) == 10
        assert cust["mobile_fpe"].isdigit()
        # Verify no plaintext strings
        assert "@" not in cust["email_token"]
        assert " " not in cust["name_token"]

    # 5. CSV Export test
    csv_resp = client.get("/api/customers/export-csv")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    csv_text = csv_resp.text
    assert "customer_id,name_token,email_token,mobile_fpe" in csv_text
    assert "@example.com" not in csv_text


def test_email_execution_and_bounce_webhook():
    """
    Verify POST /api/actions/send-email resolves token in gateway and sends SMTP,
    and POST /api/webhooks/email processes bounce via reverse resolution.
    """
    # Fetch a protected customer token
    cust_resp = client.get("/api/customers?limit=1")
    customer = cust_resp.json()["customers"][0]
    email_token = customer["email_token"]

    # 1. Dispatch email via Privacy Gateway
    send_resp = client.post("/api/actions/send-email", json={
        "recipient_token": email_token,
        "campaign_id": "CMP_TEST_001",
        "template_id": "TPL_SPRING_SALE"
    })
    assert send_resp.status_code == 200
    send_data = send_resp.json()
    assert send_data["status"] == "SENT"
    assert send_data["recipient_token"] == email_token
    assert "email" not in send_data  # Plaintext email must NOT be returned

    # 2. Process simulated provider bounce webhook
    # In seeded data, C001 corresponds to aarav.sharma1@example.com
    bounce_resp = client.post("/api/webhooks/email", json={
        "email": "aarav.sharma1@example.com",
        "event": "BOUNCE",
        "reason": "MAILBOX_FULL"
    })
    assert bounce_resp.status_code == 200
    bounce_data = bounce_resp.json()
    assert bounce_data["status"] == "PROCESSED"
    assert bounce_data["recipient_token"].startswith("EMAIL_")

    # Verify customer status was updated in protected_store
    updated_cust_resp = client.get(f"/api/customers?bounce_status=BOUNCED")
    assert updated_cust_resp.status_code == 200
    bounced_records = updated_cust_resp.json()["customers"]
    assert any(c["customer_id"] == "C001" and c["bounce_status"] == "BOUNCED" for c in bounced_records)


def test_pbac_controlled_reveal_workflow():
    """
    Verify POST /api/reveal enforces PBAC policies, returns HTTP 403 on unauthorized roles,
    resolves plaintext on authorized roles, and immutably logs every attempt.
    """
    customer_id = "C001"

    # 1. Unauthorized attempt (role MARKETING is not allowed to reveal PII)
    denied_resp = client.post("/api/reveal", json={
        "customer_id": customer_id,
        "field": "EMAIL",
        "actor": "marketer_bob",
        "role": "MARKETING",
        "purpose": "CAMPAIGN_DELIVERY",
        "reference": "REQ-001"
    })
    assert denied_resp.status_code == 403
    assert "ACCESS_DENIED" in denied_resp.text

    # 2. Authorized attempt (role CUSTOMER_SUPPORT with valid purpose)
    allowed_resp = client.post("/api/reveal", json={
        "customer_id": customer_id,
        "field": "EMAIL",
        "actor": "agent_alice",
        "role": "CUSTOMER_SUPPORT",
        "purpose": "CUSTOMER_SUPPORT",
        "reference": "TICKET-771"
    })
    assert allowed_resp.status_code == 200
    allowed_data = allowed_resp.json()
    assert allowed_data["customer_id"] == customer_id
    assert allowed_data["field"] == "EMAIL"
    assert allowed_data["authorized"] is True
    assert allowed_data["plaintext_value"] == "aarav.sharma1@example.com"

    # 3. Authorized attempt for PHONE
    phone_resp = client.post("/api/reveal", json={
        "customer_id": customer_id,
        "field": "PHONE",
        "actor": "auditor_claire",
        "role": "AUDITOR",
        "purpose": "REGULATORY_AUDIT",
        "reference": "AUDIT-2026"
    })
    assert phone_resp.status_code == 200
    assert phone_resp.json()["plaintext_value"] == "9876540001"


def test_audit_and_analytics_endpoints():
    """
    Verify GET /api/audit records all operations, and
    GET /api/analytics/summary computes BI metrics purely over protected data.
    """
    # 1. Audit logs inspection
    audit_resp = client.get("/api/audit?limit=20")
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert len(logs) > 0

    outcomes = [log["outcome"] for log in logs]
    assert "ACCESS_GRANTED" in outcomes
    assert "ACCESS_DENIED" in outcomes
    assert "SUCCESS" in outcomes

    # 2. Analytics summary
    analytics_resp = client.get("/api/analytics/summary")
    assert analytics_resp.status_code == 200
    analytics = analytics_resp.json()
    assert analytics["total_customers"] >= 50
    assert "by_city" in analytics
    assert "by_segment" in analytics
    assert "by_bounce_status" in analytics
    assert "BOUNCED" in analytics["by_bounce_status"]


def test_auth_and_2fa_workflow():
    """
    Verify authentication with 2FA requirement, OTP verification,
    and new user registration with assigned role.
    """
    # 1. Login with valid demo credentials
    login_resp = client.post("/api/auth/login", json={
        "email": "admin@flyyy.ai",
        "password": "admin123"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["status"] == "2FA_REQUIRED"
    assert "challenge_id" in login_data
    assert "demo_code" in login_data
    challenge_id = login_data["challenge_id"]
    code = login_data["demo_code"]

    # 2. Verify 2FA challenge
    verify_resp = client.post("/api/auth/verify-2fa", json={
        "challenge_id": challenge_id,
        "code": code
    })
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["status"] == "AUTHENTICATED"
    assert verify_data["user"]["two_factor_verified"] is True
    assert verify_data["user"]["role"] == "PRIVACY_ADMIN"

    # 3. Register new user
    reg_resp = client.post("/api/auth/register", json={
        "full_name": "Test Engineer",
        "email": "test.engineer@flyyy.ai",
        "password": "password123",
        "role": "AUDITOR"
    })
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert reg_data["status"] == "REGISTERED"
    assert reg_data["role"] == "AUDITOR"


def test_privacy_settings_endpoint():
    """
    Verify GET /api/privacy/settings returns cryptographic key fingerprints
    and POST /api/privacy/settings updates governance controls.
    """
    get_resp = client.get("/api/privacy/settings")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert "controls" in data
    assert "cryptographic_fingerprints" in data
    assert "fpe_scheme" in data["cryptographic_fingerprints"]
    assert "vault_scheme" in data["cryptographic_fingerprints"]

    # Update 2FA enforcement policy
    update_resp = client.post("/api/privacy/settings", json={
        "enforce_2fa_for_reveal": True,
        "data_retention_days": 120
    })
    assert update_resp.status_code == 200
    update_data = update_resp.json()
    assert update_data["controls"]["data_retention_days"] == 120


def test_source_customer_creation():
    """
    Verify POST /api/source/customers creates a source record,
    enforces 10-digit mobile number, and auto-protects into protected_store.
    """
    # 1. Invalid phone rejection (<10 digits)
    bad_resp = client.post("/api/source/customers", json={
        "name": "Invalid Phone",
        "email": "invalid@example.com",
        "mobile": "12345"
    })
    assert bad_resp.status_code == 400

    # 2. Valid creation with auto-protection
    good_resp = client.post("/api/source/customers", json={
        "name": "Ananya Sen",
        "email": "ananya.sen@example.com",
        "mobile": "9811223344",
        "city": "Bengaluru",
        "segment": "Enterprise",
        "auto_protect": True
    })
    assert good_resp.status_code == 200
    res_data = good_resp.json()
    assert res_data["status"] == "CREATED"
    assert res_data["auto_protected"] is True
    # Verify FPE phone is exactly 10 digits
    assert len(res_data["protected_preview"]["mobile_fpe"]) == 10
    assert res_data["protected_preview"]["mobile_fpe"].isdigit()
    assert res_data["protected_preview"]["email_token"].startswith("EMAIL_")

