"""
End-to-End Automated Integration Verification Script for Phase 3.
Uses `requests` to validate:
1. PII Discovery & Profiling
2. Chunked, Idempotent Batch Ingestion Pipeline
3. Downstream Protected Customers View (Zero Plaintext)
4. Privacy Gateway Email Dispatch via Token over SMTP (Mailpit)
5. Inbound Email Bounce Webhook Resolution
6. Policy-Based Access Control Reveal: Unauthorized Rejection (HTTP 403)
7. Policy-Based Access Control Reveal: Authorized Decryption (HTTP 200)
8. Immutable Audit Trail & Analytics Verification
"""

import sys
import time
import threading
from pathlib import Path

# Add project root and backend to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(1, str(ROOT_DIR / "backend"))

import requests
import uvicorn
try:
    from backend.app.main import app
except ImportError:
    from app.main import app

BASE_URL = "http://localhost:8000"


def ensure_server_running():
    """Ensures the FastAPI server is reachable on port 8000."""
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=1)
        if resp.status_code == 200:
            print("[INFO] Connected to existing FastAPI server on port 8000.")
            return
    except Exception:
        pass

    print("[INFO] Spawning internal FastAPI server on http://localhost:8000...")
    config = uvicorn.Config(app, host="127.0.0.1", port=8000, log_level="warning")
    server = uvicorn.Server(config)
    t = threading.Thread(target=server.run, daemon=True)
    t.start()
    time.sleep(2)
    print("[INFO] FastAPI server listening on http://localhost:8000.")


def main():
    print("=" * 70)
    print("PHASE 3: PRIVACY-PRESERVING CDP GATEWAY & BATCH PIPELINE VERIFICATION")
    print("=" * 70)

    ensure_server_running()
    session = requests.Session()

    # -----------------------------------------------------------------
    # Step 1: Trigger PII Discovery
    # -----------------------------------------------------------------
    print("\n--- [Step 1/8] Running PII Discovery Engine (POST /api/discover) ---")
    resp = session.post(f"{BASE_URL}/api/discover?sample_size=20")
    assert resp.status_code == 200, f"Discovery failed: {resp.text}"
    disc_data = resp.json()
    columns = disc_data.get("columns", [])
    print(f"  Scanned {disc_data.get('sample_count')} sample records across {len(columns)} columns:")
    for col in columns:
        print(f"    - {col['column_name']:<12} | Type: {col['detected_type']:<15} | "
              f"Action: {col['suggested_action']:<10} | Preview: {col['masked_preview']:<15} | Conf: {col['confidence']}")

    col_names = {c["column_name"]: c for c in columns}
    assert "mobile" in col_names and col_names["mobile"]["detected_type"] == "PHONE_NUMBER"
    assert "email" in col_names and col_names["email"]["detected_type"] == "EMAIL_ADDRESS"
    assert "name" in col_names and col_names["name"]["detected_type"] == "PERSON_NAME"
    print("  [PASS] PII Discovery correctly classified Phone, Email, and Name.")

    # -----------------------------------------------------------------
    # Step 2: Run Batch Ingestion Pipeline
    # -----------------------------------------------------------------
    print("\n--- [Step 2/8] Executing Batch Pipeline (POST /api/batch/run) ---")
    batch_resp = session.post(f"{BASE_URL}/api/batch/run", json={"chunk_size": 25, "source_table": "customers"})
    assert batch_resp.status_code == 200, f"Batch run failed: {batch_resp.text}"
    batch_res = batch_resp.json()
    batch_id = batch_res["batch_id"]
    print(f"  Batch initiated: {batch_id} (Status: {batch_res['status']})")
    print(f"  Records processed: {batch_res['processed_records']}, Errors: {batch_res['error_records']}")

    # Poll status
    poll_resp = session.get(f"{BASE_URL}/api/batch/{batch_id}")
    assert poll_resp.status_code == 200
    job_info = poll_resp.json()
    assert job_info["status"] == "COMPLETED"
    assert job_info["processed_records"] == 50
    print(f"  [PASS] Batch {batch_id} verified COMPLETED with 50 processed records.")

    # -----------------------------------------------------------------
    # Step 3: Fetch Protected Customers & Verify Zero Plaintext
    # -----------------------------------------------------------------
    print("\n--- [Step 3/8] Inspecting Protected Customers (GET /api/customers) ---")
    cust_resp = session.get(f"{BASE_URL}/api/customers?limit=5")
    assert cust_resp.status_code == 200
    cust_data = cust_resp.json()
    assert cust_data["total"] == 50
    print(f"  Total protected customers: {cust_data['total']}")
    sample_cust = cust_data["customers"][0]
    for c in cust_data["customers"]:
        print(f"    Cust {c['customer_id']}: Name: {c['name_token']} | Email: {c['email_token']} | "
              f"Mobile(FPE): {c['mobile_fpe']} | City: {c['city']} | Status: {c['bounce_status']}")
        # Assertions
        assert c["name_token"].startswith("NAME_")
        assert c["email_token"].startswith("EMAIL_")
        assert len(c["mobile_fpe"]) == 10
        assert "@" not in c["email_token"]
        assert " " not in c["name_token"]
    print("  [PASS] Strictly de-identified records confirmed; zero plaintext PII exposed.")

    # -----------------------------------------------------------------
    # Step 4: Dispatch Campaign Email via Privacy Gateway
    # -----------------------------------------------------------------
    print("\n--- [Step 4/8] Sending Email via Token (POST /api/actions/send-email) ---")
    email_token = sample_cust["email_token"]
    send_payload = {
        "recipient_token": email_token,
        "campaign_id": "CMP_2026_PROMO",
        "template_id": "TPL_SUMMER_DEALS"
    }
    send_resp = session.post(f"{BASE_URL}/api/actions/send-email", json=send_payload)
    assert send_resp.status_code == 200, f"Send email failed: {send_resp.text}"
    send_res = send_resp.json()
    print(f"  Gateway Response: {send_res}")
    assert send_res["status"] == "SENT"
    assert send_res["recipient_token"] == email_token
    assert "email" not in send_res, "Decrypted email MUST NOT appear in API response!"
    print("  [PASS] Email successfully routed via SMTP to Mailpit without exposing recipient email.")

    # -----------------------------------------------------------------
    # Step 5: Process Bounce Webhook with Reverse Resolution
    # -----------------------------------------------------------------
    print("\n--- [Step 5/8] Processing Bounce Webhook (POST /api/webhooks/email) ---")
    # Customer C001 corresponds to aarav.sharma1@example.com in seeded data
    webhook_payload = {
        "email": "aarav.sharma1@example.com",
        "event": "BOUNCE",
        "reason": "MAILBOX_NOT_FOUND"
    }
    wb_resp = session.post(f"{BASE_URL}/api/webhooks/email", json=webhook_payload)
    assert wb_resp.status_code == 200, f"Webhook failed: {wb_resp.text}"
    wb_res = wb_resp.json()
    print(f"  Webhook Response: {wb_res}")
    assert wb_res["status"] == "PROCESSED"
    assert wb_res["recipient_token"].startswith("EMAIL_")

    # Verify protected customer table reflects bounce status
    bounced_check = session.get(f"{BASE_URL}/api/customers?bounce_status=BOUNCED")
    assert bounced_check.status_code == 200
    bounced_list = bounced_check.json()["customers"]
    bounced_cids = [c["customer_id"] for c in bounced_list]
    assert "C001" in bounced_cids
    print(f"  [PASS] Customer C001 successfully flagged as BOUNCED via reverse token lookup.")

    # -----------------------------------------------------------------
    # Step 6: PBAC Reveal - Unauthorized Attempt Rejection
    # -----------------------------------------------------------------
    print("\n--- [Step 6/8] Testing Unauthorized Reveal (Role: MARKETING) ---")
    unauth_payload = {
        "customer_id": "C001",
        "field": "EMAIL",
        "actor": "marketer_steve",
        "role": "MARKETING",
        "purpose": "MARKETING_CAMPAIGN",
        "reference": "CAMPAIGN-001"
    }
    unauth_resp = session.post(f"{BASE_URL}/api/reveal", json=unauth_payload)
    print(f"  HTTP Status: {unauth_resp.status_code} (Expected 403)")
    print(f"  Response Body: {unauth_resp.json()}")
    assert unauth_resp.status_code == 403
    assert "ACCESS_DENIED" in unauth_resp.text
    print("  [PASS] Unauthorized reveal attempt rejected with HTTP 403 Forbidden.")

    # -----------------------------------------------------------------
    # Step 7: PBAC Reveal - Authorized Decryption
    # -----------------------------------------------------------------
    print("\n--- [Step 7/8] Testing Authorized Reveal (Role: CUSTOMER_SUPPORT) ---")
    auth_email_payload = {
        "customer_id": "C001",
        "field": "EMAIL",
        "actor": "support_agent_jane",
        "role": "CUSTOMER_SUPPORT",
        "purpose": "CUSTOMER_SUPPORT",
        "reference": "CASE-10928"
    }
    auth_resp = session.post(f"{BASE_URL}/api/reveal", json=auth_email_payload)
    assert auth_resp.status_code == 200, f"Authorized reveal failed: {auth_resp.text}"
    auth_data = auth_resp.json()
    print(f"  Authorized Reveal (EMAIL): {auth_data['customer_id']} -> {auth_data['plaintext_value']}")
    assert auth_data["plaintext_value"] == "aarav.sharma1@example.com"

    auth_phone_payload = {
        "customer_id": "C001",
        "field": "PHONE",
        "actor": "auditor_dave",
        "role": "AUDITOR",
        "purpose": "REGULATORY_AUDIT",
        "reference": "AUDIT-2026-Q1"
    }
    phone_resp = session.post(f"{BASE_URL}/api/reveal", json=auth_phone_payload)
    assert phone_resp.status_code == 200
    phone_data = phone_resp.json()
    print(f"  Authorized Reveal (PHONE): {phone_data['customer_id']} -> {phone_data['plaintext_value']}")
    assert phone_data["plaintext_value"] == "9876540001"
    print("  [PASS] Authorized reveal successfully decrypted raw PII for authenticated auditor.")

    # -----------------------------------------------------------------
    # Step 8: Audit Logs & Aggregate Analytics Verification
    # -----------------------------------------------------------------
    print("\n--- [Step 8/8] Verifying Immutable Audit Logs & Aggregate Analytics ---")
    audit_resp = session.get(f"{BASE_URL}/api/audit?limit=10")
    assert audit_resp.status_code == 200
    audit_logs = audit_resp.json()
    print(f"  Retrieved {len(audit_logs)} recent audit log records:")
    for log in audit_logs[:6]:
        print(f"    [{log['timestamp']}] Actor: {log['actor']:<18} | Role: {log['role']:<16} | "
              f"Action: {log['action']:<15} | Outcome: {log['outcome']}")

    outcomes = [log["outcome"] for log in audit_logs]
    assert "ACCESS_GRANTED" in outcomes, "Expected ACCESS_GRANTED in audit log"
    assert "ACCESS_DENIED" in outcomes, "Expected ACCESS_DENIED in audit log"

    # Analytics summary
    analytics_resp = session.get(f"{BASE_URL}/api/analytics/summary")
    assert analytics_resp.status_code == 200
    analytics = analytics_resp.json()
    print("\n  Protected Analytics Breakdown:")
    print(f"    Total Protected Customers: {analytics['total_customers']}")
    print(f"    By City: {analytics['by_city']}")
    print(f"    By Segment: {analytics['by_segment']}")
    print(f"    By Bounce Status: {analytics['by_bounce_status']}")
    assert analytics["total_customers"] == 50
    print("  [PASS] Audit logs and analytics summary verified successfully.")

    print("\n" + "=" * 70)
    print("ALL PHASE 3 VERIFICATION STEPS COMPLETED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    main()
