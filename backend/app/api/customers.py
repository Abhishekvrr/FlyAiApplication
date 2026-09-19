"""
Downstream Protected Customer Views & De-identified CSV Export.
Queries strictly and exclusively from protected_store.customers_protected.
Never touches or joins source_store or vault_store.
"""

import csv
import io
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter(prefix="/customers", tags=["Protected Customers"])


@router.get("")
def list_protected_customers(
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    city: Optional[str] = None,
    segment: Optional[str] = None,
    bounce_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns de-identified customer records from protected_store.customers_protected.
    Includes deterministic tokens and FPE-encrypted phone numbers.
    Never touches source or vault tables.
    """
    try:
        filters = []
        params: dict[str, Any] = {"limit": limit, "offset": offset}

        if city:
            filters.append("city = :city")
            params["city"] = city
        if segment:
            filters.append("segment = :segment")
            params["segment"] = segment
        if bounce_status:
            filters.append("bounce_status = :bounce_status")
            params["bounce_status"] = bounce_status

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        # Total count query
        count_query = text(f"SELECT COUNT(*) FROM protected_store.customers_protected {where_clause};")
        total_count = db.execute(count_query, params).scalar() or 0

        # Data query
        data_query = text(f"""
            SELECT customer_id, name_token, email_token, mobile_fpe,
                   city, segment, bounce_status, bounce_reason, updated_at
            FROM protected_store.customers_protected
            {where_clause}
            ORDER BY customer_id
            LIMIT :limit OFFSET :offset;
        """)
        rows = db.execute(data_query, params).mappings().all()

        return {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "customers": [dict(r) for r in rows]
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve protected customer records."
        )


@router.get("/export-csv")
def export_protected_customers_csv(
    city: Optional[str] = None,
    segment: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Streams a CSV export strictly from protected_store.customers_protected.
    Guarantees exports are 100% devoid of plaintext PII, containing only tokens and FPE values.
    """
    try:
        filters = []
        params = {}
        if city:
            filters.append("city = :city")
            params["city"] = city
        if segment:
            filters.append("segment = :segment")
            params["segment"] = segment

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        query = text(f"""
            SELECT customer_id, name_token, email_token, mobile_fpe,
                   city, segment, bounce_status, bounce_reason, updated_at
            FROM protected_store.customers_protected
            {where_clause}
            ORDER BY customer_id;
        """)
        rows = db.execute(query, params).mappings().all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "customer_id", "name_token", "email_token", "mobile_fpe",
            "city", "segment", "bounce_status", "bounce_reason", "updated_at"
        ])

        for row in rows:
            writer.writerow([
                row["customer_id"],
                row["name_token"],
                row["email_token"],
                row["mobile_fpe"],
                row["city"],
                row["segment"],
                row["bounce_status"],
                row["bounce_reason"] or "",
                str(row["updated_at"])
            ])

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=customers_protected.csv"}
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate protected customers CSV export."
        )


@router.get("/{customer_id}")
def get_single_protected_customer(customer_id: str, db: Session = Depends(get_db)):
    """
    Returns single protected customer record from protected_store.customers_protected.
    Complies with Table 16: GET /customers/{id}.
    """
    try:
        query = text("""
            SELECT customer_id, name_token, email_token, mobile_fpe,
                   city, segment, bounce_status, bounce_reason, updated_at
            FROM protected_store.customers_protected
            WHERE customer_id = :customer_id;
        """)
        row = db.execute(query, {"customer_id": customer_id}).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail=f"Customer '{customer_id}' not found.")
        return dict(row)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve customer.")
