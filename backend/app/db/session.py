"""
SQLAlchemy Database Engine and Session Generator
Manages isolated CDP schema queries securely.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Load environment configuration (check backend/.env or workspace root .env)
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if not _env_path.exists():
    _env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=_env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not configured.")

# Initialize SQLAlchemy engine with connection health checks
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    FastAPI dependency yielding a database session.
    Guarantees session cleanup upon request termination.
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
