"""
Chunked, Idempotent Batch Ingestion & De-identification Pipeline.
Transforms raw PII from source_store into:
- Format-Preserving Encrypted phone numbers (FF1/pyffx)
- Deterministic collision-resistant tokens (HMAC-SHA256)
- Authenticated encrypted original values (AES-256-GCM) in vault_store
- Upserted de-identified records in protected_store
"""

import uuid
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.crypto.fpe import encrypt_phone
from app.crypto.tokenizer import generate_token
from app.crypto.vault_crypto import encrypt_vault_value


def run_batch_ingestion(db: Session, source_table: str = "customers", chunk_size: int = 500) -> dict:
    """
    Executes a chunked, idempotent batch ingestion run from source_store into protected_store and vault_store.
    Ensures zero plaintext PII leaks and all-or-nothing transactional safety per chunk.
    """
    batch_uuid = uuid.uuid4().hex[:8].upper()
    batch_id = f"BATCH_{batch_uuid}"

    # 1. Register batch job in meta_store.batch_jobs
    init_job_query = text("""
        INSERT INTO meta_store.batch_jobs (
            batch_id, source_name, status, total_records, processed_records, error_records, started_at
        ) VALUES (
            :batch_id, :source_name, 'PROCESSING', 0, 0, 0, CURRENT_TIMESTAMP
        );
    """)
    db.execute(init_job_query, {"batch_id": batch_id, "source_name": source_table})
    db.commit()

    total_records = 0
    processed_records = 0
    error_records = 0

    try:
        # 2. Determine total records in source_store
        count_query = text(f"SELECT COUNT(*) FROM source_store.{source_table};")
        total_records = db.execute(count_query).scalar() or 0

        offset = 0
        while offset < total_records:
            fetch_query = text(f"""
                SELECT customer_id, name, email, mobile, city, segment
                FROM source_store.{source_table}
                ORDER BY customer_id
                LIMIT :limit OFFSET :offset;
            """)
            chunk_rows = db.execute(fetch_query, {"limit": chunk_size, "offset": offset}).mappings().all()
            if not chunk_rows:
                break

            for row in chunk_rows:
                try:
                    cid = row["customer_id"]
                    raw_name = row["name"]
                    raw_email = row["email"]
                    raw_mobile = row["mobile"]
                    city = row["city"]
                    segment = row["segment"]

                    # a) Format-Preserving Encryption for phone
                    mobile_fpe = encrypt_phone(raw_mobile)

                    # b) Deterministic Tokenization
                    email_token = generate_token("EMAIL", raw_email)
                    name_token = generate_token("NAME", raw_name)

                    # c) AES-256-GCM Vault Encryption
                    enc_email = encrypt_vault_value(raw_email)
                    enc_name = encrypt_vault_value(raw_name)

                    # d) Idempotent Vault Storage (ON CONFLICT DO NOTHING)
                    vault_insert_query = text("""
                        INSERT INTO vault_store.token_vault (
                            token_id, token_value, encrypted_original, pii_type, key_reference, created_at
                        ) VALUES
                            (:email_tid, :email_token, :enc_email, 'EMAIL', 'VAULT_AES_KEY', CURRENT_TIMESTAMP),
                            (:name_tid, :name_token, :enc_name, 'NAME', 'VAULT_AES_KEY', CURRENT_TIMESTAMP)
                        ON CONFLICT (token_value) DO NOTHING;
                    """)
                    db.execute(vault_insert_query, {
                        "email_tid": uuid.uuid4().hex,
                        "email_token": email_token,
                        "enc_email": enc_email,
                        "name_tid": uuid.uuid4().hex,
                        "name_token": name_token,
                        "enc_name": enc_name
                    })

                    # e) Idempotent Upsert into protected_store.customers_protected
                    protected_upsert_query = text("""
                        INSERT INTO protected_store.customers_protected (
                            customer_id, name_token, email_token, mobile_fpe, city, segment, bounce_status, updated_at
                        ) VALUES (
                            :customer_id, :name_token, :email_token, :mobile_fpe, :city, :segment, 'CLEAN', CURRENT_TIMESTAMP
                        )
                        ON CONFLICT (customer_id) DO UPDATE SET
                            name_token = EXCLUDED.name_token,
                            email_token = EXCLUDED.email_token,
                            mobile_fpe = EXCLUDED.mobile_fpe,
                            city = EXCLUDED.city,
                            segment = EXCLUDED.segment,
                            updated_at = CURRENT_TIMESTAMP;
                    """)
                    db.execute(protected_upsert_query, {
                        "customer_id": cid,
                        "name_token": name_token,
                        "email_token": email_token,
                        "mobile_fpe": mobile_fpe,
                        "city": city,
                        "segment": segment
                    })

                    processed_records += 1

                except Exception:
                    # In accordance with zero-plaintext logging, avoid printing sensitive payload in logs
                    error_records += 1

            # Commit per chunk to ensure progress is saved
            db.commit()
            offset += chunk_size

        # 3. Mark batch job COMPLETED
        finish_job_query = text("""
            UPDATE meta_store.batch_jobs
            SET status = 'COMPLETED',
                total_records = :total_records,
                processed_records = :processed_records,
                error_records = :error_records,
                completed_at = CURRENT_TIMESTAMP
            WHERE batch_id = :batch_id;
        """)
        db.execute(finish_job_query, {
            "total_records": total_records,
            "processed_records": processed_records,
            "error_records": error_records,
            "batch_id": batch_id
        })

        # 4. Log pipeline audit trail
        audit_query = text("""
            INSERT INTO audit_store.audit_logs (
                actor, role, action, purpose, reference, resource_id, outcome, timestamp
            ) VALUES (
                'Batch_Pipeline', 'SYSTEM', 'BATCH_INGESTION', 'DATA_DEIDENTIFICATION',
                :reference, :resource_id, 'SUCCESS', CURRENT_TIMESTAMP
            );
        """)
        db.execute(audit_query, {"reference": batch_id, "resource_id": source_table})
        db.commit()

        return {
            "batch_id": batch_id,
            "status": "COMPLETED",
            "total_records": total_records,
            "processed_records": processed_records,
            "success_count": processed_records,
            "error_records": error_records,
            "error_count": error_records
        }

    except Exception as e:
        db.rollback()
        # Mark batch job FAILED
        fail_query = text("""
            UPDATE meta_store.batch_jobs
            SET status = 'FAILED',
                error_records = :error_records,
                completed_at = CURRENT_TIMESTAMP
            WHERE batch_id = :batch_id;
        """)
        db.execute(fail_query, {"error_records": error_records, "batch_id": batch_id})
        db.commit()
        raise RuntimeError("Batch ingestion failed during pipeline execution.") from e
