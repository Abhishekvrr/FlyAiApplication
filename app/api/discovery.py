"""
PII Discovery and Column Profiling Router.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.discovery.pii_engine import scan_table_sample

router = APIRouter(prefix="/api", tags=["Discovery"])


@router.post("/discover")
def discover_pii(sample_size: int = 20, db: Session = Depends(get_db)):
    """
    Samples records from source_store.customers, runs automated discovery profiling,
    and returns detected PII types, confidence scores, suggested policies, and masked previews.
    """
    try:
        sample_query = text(f"""
            SELECT customer_id, name, email, mobile, city, segment
            FROM source_store.customers
            ORDER BY customer_id
            LIMIT :limit;
        """)
        rows = db.execute(sample_query, {"limit": sample_size}).mappings().all()
        sample_records = [dict(row) for row in rows]

        if not sample_records:
            return {"columns": [], "sample_count": 0}

        profiles = scan_table_sample(sample_records)
        return {
            "columns": profiles,
            "sample_count": len(sample_records)
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to perform PII discovery profiling."
        )
