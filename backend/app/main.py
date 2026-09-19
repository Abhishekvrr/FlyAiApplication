"""
FastAPI Privacy Gateway Application Entrypoint.
Initializes the Privacy-Preserving CDP Gateway with schema isolation,
CORS middleware, sanitized global error handling, and security routers.
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.discovery import router as discovery_router
from app.api.batch import router as batch_router
from app.api.customers import router as customers_router
from app.api.actions import router as actions_router
from app.api.reveal import router as reveal_router
from app.api.audit import router as audit_router
from app.api.policies import router as policies_router
from app.api.auth import router as auth_router
from app.api.privacy_settings import router as privacy_settings_router

app = FastAPI(
    title="Privacy-Preserving CDP Gateway",
    description="Enterprise Privacy-Preserving Customer Data Platform API & Privacy Gateway",
    version="1.0.0"
)

# 1. Enable CORS Middleware for local frontend and testing clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Exception Handlers: Handle HTTP exceptions with exact status codes and sanitize internal errors
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        return JSONResponse(status_code=exc.status_code, content=detail)
    return JSONResponse(status_code=exc.status_code, content={"status": detail, "detail": detail})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log sanitized notification without exposing raw request payload or internal exception strings
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "INTERNAL_SERVER_ERROR", "detail": "An internal server error occurred."}
    )

# 3. Mount Routers under both /api and root level (PDF Section 16 & Section 13/14 compliance)
app.include_router(auth_router)
app.include_router(privacy_settings_router)

# /api-prefixed routes (Frontend React Dashboard & API clients)
app.include_router(discovery_router, prefix="/api")
app.include_router(batch_router, prefix="/api")
app.include_router(customers_router, prefix="/api")
app.include_router(actions_router, prefix="/api")
app.include_router(reveal_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(policies_router, prefix="/api")

# Top-level direct routes (Section 16 Minimum API Set & Gateway Endpoints)
app.include_router(discovery_router)
app.include_router(batch_router)
app.include_router(customers_router)
app.include_router(actions_router)
app.include_router(reveal_router)
app.include_router(audit_router)
app.include_router(policies_router)



@app.get("/health", tags=["Health"])
def health_check():
    """Service health verification endpoint."""
    return {"status": "HEALTHY", "service": "privacy_gateway"}


@app.get("/", tags=["Root"])
def root():
    """Root platform metadata endpoint."""
    return {
        "platform": "Enterprise Privacy-Preserving CDP",
        "phase": 3,
        "docs_url": "/docs"
    }
