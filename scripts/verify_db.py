"""
Database Schema and Isolation Verification Script
Checks the presence and queryability of all 5 isolated CDP schemas:
- source_store (customers)
- protected_store (customers_protected)
- vault_store (token_vault)
- audit_store (audit_logs)
- meta_store (batch_jobs)
Verifies that source_store.customers contains 50 records.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is missing.", file=sys.stderr)
    sys.exit(1)


def verify_database():
    print(f"Connecting to database: {DATABASE_URL.split('@')[-1]}...")
    engine = create_engine(DATABASE_URL)

    required_tables = [
        ("source_store", "customers"),
        ("protected_store", "customers_protected"),
        ("vault_store", "token_vault"),
        ("audit_store", "audit_logs"),
        ("meta_store", "batch_jobs")
    ]

    all_passed = True

    with engine.connect() as conn:
        print("\n--- 1. Verifying Schemas and Tables ---")
        for schema, table in required_tables:
            query = text(f"SELECT COUNT(*) FROM {schema}.{table};")
            try:
                result = conn.execute(query)
                row_count = result.scalar()
                print(f"  [OK] Table {schema}.{table} is accessible (current row count: {row_count})")
            except Exception as e:
                print(f"  [FAIL] Failed querying {schema}.{table}: {e}")
                all_passed = False

        print("\n--- 2. Verifying Seeded Source Customers ---")
        customer_count_query = text("SELECT COUNT(*) FROM source_store.customers;")
        customer_count = conn.execute(customer_count_query).scalar()
        print(f"  Total records in source_store.customers: {customer_count}")

        if customer_count == 50:
            print("  [OK] Exactly 50 records verified in source_store.customers.")
        else:
            print(f"  [FAIL] Expected 50 records, found {customer_count}.")
            all_passed = False

        print("\n--- 3. Sampling Seeded Data ---")
        sample_query = text("""
            SELECT customer_id, name, email, mobile, city, segment 
            FROM source_store.customers 
            ORDER BY customer_id ASC 
            LIMIT 5;
        """)
        samples = conn.execute(sample_query).fetchall()
        for s in samples:
            print(f"  Customer {s[0]}: {s[1]} | {s[2]} | Phone: {s[3]} ({len(s[3])} digits) | {s[4]} | {s[5]}")

    if all_passed:
        print("\n=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ===")
        return 0
    else:
        print("\n=== VERIFICATION CHECKS FAILED ===")
        return 1


if __name__ == "__main__":
    sys.exit(verify_database())
