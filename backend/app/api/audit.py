"""
Audit Log Inspection and Protected Data Analytics Router.
Analytics are computed purely on protected_store.customers_protected.
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter(tags=["Audit & Analytics"])


@router.get("/audit")
def list_audit_logs(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    action: Optional[str] = None,
    outcome: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns immutable audit trail records from audit_store.audit_logs,
    ordered by timestamp descending.
    """
    try:
        filters = []
        params: dict[str, Any] = {"limit": limit, "offset": offset}
        if action:
            filters.append("action = :action")
            params["action"] = action
        if outcome:
            filters.append("outcome = :outcome")
            params["outcome"] = outcome

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        query = text(f"""
            SELECT id, timestamp, actor, role, action, purpose, reference, resource_id, outcome
            FROM audit_store.audit_logs
            {where_clause}
            ORDER BY timestamp DESC
            LIMIT :limit OFFSET :offset;
        """)
        rows = db.execute(query, params).mappings().all()
        return [dict(r) for r in rows]

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve audit log entries."
        )


@router.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Aggregates business intelligence metrics purely from protected_store.customers_protected.
    Demonstrates that analytics, segmentation, and bounce tracking operate seamlessly on
    tokenized and FPE-encrypted data without plaintext exposure.
    """
    try:
        # 1. Total protected records
        total_query = text("SELECT COUNT(*) FROM protected_store.customers_protected;")
        total_customers = db.execute(total_query).scalar() or 0

        # 2. Customers per city
        city_query = text("""
            SELECT city, COUNT(*) as count
            FROM protected_store.customers_protected
            GROUP BY city
            ORDER BY count DESC;
        """)
        city_rows = db.execute(city_query).mappings().all()
        by_city = {r["city"]: r["count"] for r in city_rows}

        # 3. Customers per segment
        segment_query = text("""
            SELECT segment, COUNT(*) as count
            FROM protected_store.customers_protected
            GROUP BY segment
            ORDER BY count DESC;
        """)
        segment_rows = db.execute(segment_query).mappings().all()
        by_segment = {r["segment"]: r["count"] for r in segment_rows}

        # 4. Bounce status breakdown
        bounce_query = text("""
            SELECT bounce_status, COUNT(*) as count
            FROM protected_store.customers_protected
            GROUP BY bounce_status;
        """)
        bounce_rows = db.execute(bounce_query).mappings().all()
        by_bounce_status = {r["bounce_status"]: r["count"] for r in bounce_rows}

        return {
            "total_customers": total_customers,
            "by_city": by_city,
            "by_segment": by_segment,
            "by_bounce_status": by_bounce_status
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate analytics summary."
        )
