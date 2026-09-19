# Backend Layer (FastAPI & Cryptographic Privacy Vault)

This directory contains the FastAPI Privacy Gateway, Cryptographic Vault, PII Discovery Engine, and automated test suite for Flyy AI CDP.

## Architecture & Directory Structure

```
backend/
├── app/
│   ├── api/                  # REST API endpoints & route handlers
│   │   ├── actions.py        # Campaign execution & webhook proxy
│   │   ├── audit.py          # Immutable audit log queries & analytics
│   │   ├── auth.py           # User authentication & 2FA verification
│   │   ├── batch.py          # High-throughput batch ingestion pipeline
│   │   ├── customers.py      # Downstream protected customer views (zero plaintext)
│   │   ├── discovery.py      # Automated PII discovery profiling
│   │   ├── policies.py       # Privacy policy configuration
│   │   ├── privacy_settings.py # System privacy flags
│   │   └── reveal.py         # Dual-custody justified PII reveal endpoint
│   │
│   ├── crypto/               # Core Cryptographic Vault implementation
│   │   ├── fpe.py            # FF1 Format-Preserving Encryption for phone numbers
│   │   ├── tokenizer.py      # Deterministic HMAC-SHA256 tokenization
│   │   └── vault_crypto.py   # Reversible AES-256-GCM authenticated encryption
│   │
│   ├── db/                   # Database session and connection pooling
│   │   └── session.py        # SQLAlchemy engine and get_db dependency
│   │
│   ├── discovery/            # PII discovery engine
│   │   └── pii_engine.py     # Microsoft Presidio + regex + entropy profiling
│   │
│   ├── pipeline/             # Ingestion batch processor
│   │   └── ingestion.py      # Chunked ingestion worker and error isolation
│   │
│   └── main.py               # FastAPI application definition and CORS setup
│
├── tests/                    # Automated test suite
│   ├── test_api.py           # Integration tests for all endpoints
│   └── test_crypto.py        # Cryptographic unit tests (FPE, AES-GCM, Tokenizer)
│
├── requirements.txt          # Backend Python dependencies
├── run.py                    # One-command backend runner with auto-reload
└── README.md                 # This documentation
```

## Running the Backend

### Quick Run
From the repository root:
```powershell
python backend/run.py
```

### Or using Uvicorn directly
From the repository root:
```powershell
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
Or from inside the `backend/` directory:
```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **OpenAPI JSON**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

## Running Tests
```powershell
python -m pytest backend/tests/test_crypto.py
```
*(For `backend/tests/test_api.py`, ensure PostgreSQL is running via `python scripts/start_services.py`)*
