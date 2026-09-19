"""
Batch Orchestration & Pipeline Monitoring Router.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.pipeline.ingestion import run_batch_ingestion

router = APIRouter(prefix="/api/batch", tags=["Batch Processing"])


class BatchRunRequest(BaseModel):
    chunk_size: int = Field(default=500, ge=1, le=10000)
    source_table: str = Field(default="customers")


@router.post("/run")
def trigger_batch_run(payload: Optional[BatchRunRequest] = None, db: Session = Depends(get_db)):
    """
    Triggers an idempotent, chunked batch ingestion pipeline run.
    De-identifies customer records into protected_store and stores encrypted originals in vault_store.
    """
    chunk_size = payload.chunk_size if payload else 500
    source_table = payload.source_table if payload else "customers"

    try:
        result = run_batch_ingestion(db=db, source_table=source_table, chunk_size=chunk_size)
        return result
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Batch ingestion pipeline failed."
        )


@router.get("")
def list_batch_jobs(db: Session = Depends(get_db)):
    """
    Returns list of all historical batch pipeline runs from meta_store.batch_jobs.
    """
    try:
        query = text("""
            SELECT batch_id, source_name, status, total_records, processed_records,
                   error_records, started_at, completed_at
            FROM meta_store.batch_jobs
            ORDER BY started_at DESC;
        """)
        rows = db.execute(query).mappings().all()
        return [dict(row) for row in rows]
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to query batch jobs history."
        )


@router.get("/{batch_id}")
def get_batch_job(batch_id: str, db: Session = Depends(get_db)):
    """
    Returns the execution status, processed record counts, and timestamps for a specific batch job.
    """
    try:
        query = text("""
            SELECT batch_id, source_name, status, total_records, processed_records,
                   error_records, started_at, completed_at
            FROM meta_store.batch_jobs
            WHERE batch_id = :batch_id;
        """)
        job = db.execute(query, {"batch_id": batch_id}).mappings().first()
        if not job:
            raise HTTPException(status_code=404, detail="Batch job not found.")
        return dict(job)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve batch job."
        )
