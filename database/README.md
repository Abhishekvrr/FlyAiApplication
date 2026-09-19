# Database Layer

This directory houses the PostgreSQL schema definitions, seed data generators, and schema verification tools for Flyy AI CDP.

## Multi-Schema Isolation Architecture

The database enforces cryptographic and physical isolation across five distinct PostgreSQL schemas:

```
cdp_platform (PostgreSQL Database)
├── source_store        # Raw PII ingestion perimeter (restricted from downstream access)
│   └── customers       # customer_id, name, email, mobile, city, segment, created_at
│
├── protected_store     # De-identified data used by analytics, queries, and campaigns
│   └── customers_protected # customer_id, name_token, email_token, mobile_fpe, city, segment, bounce_status...
│
├── vault_store         # Hardware/role-restricted cryptographic key and token vault
│   └── token_vault     # token_id, token_value, encrypted_original (AES-256-GCM), pii_type...
│
├── audit_store         # Immutable audit log ledger for compliance (GDPR, DPDP, HIPAA)
│   └── audit_logs      # id, timestamp, actor, role, action, purpose, reference, resource_id, outcome
│
└── meta_store          # Pipeline execution state and batch tracking
    └── batch_jobs      # batch_id, source_name, status, total_records, processed_records...
```

## Files

- **`init.sql`**: Complete DDL defining all 5 schemas, tables, and constraints. Applied automatically on container startup or via `scripts/start_services.py`.
- **`seed_source.py`**: Generates and inserts 50 realistic, format-compliant customer records with 10-digit phone numbers for FF1 FPE encryption.
- **`verify_db.py`**: Smoke tests table connectivity, record counts, and schema boundaries.

## Usage

### 1. Seed Customer Records
```powershell
python database/seed_source.py
```

### 2. Verify Schema Integrity
```powershell
python database/verify_db.py
```
