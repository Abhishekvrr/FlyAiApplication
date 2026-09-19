"""
Authentication and Two-Factor Authentication (2FA) Router.
Supports User Registration, Login, and 6-digit OTP verification via Mailpit SMTP.
"""

import os
import uuid
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/auth", tags=["User Authentication & 2FA"])

# In-memory user store seeded with standard enterprise roles
USER_DATABASE: Dict[str, dict] = {
    "admin@flyyy.ai": {
        "user_id": "USR_001",
        "email": "admin@flyyy.ai",
        "username": "admin",
        "full_name": "Security Administrator",
        "role": "PRIVACY_ADMIN",
        "password": "admin123",
        "two_factor_enabled": True,
        "created_at": "2026-09-18T00:00:00Z"
    },
    "support@flyyy.ai": {
        "user_id": "USR_002",
        "email": "support@flyyy.ai",
        "username": "support",
        "full_name": "Support Specialist Jane",
        "role": "CUSTOMER_SUPPORT",
        "password": "support123",
        "two_factor_enabled": True,
        "created_at": "2026-09-18T00:00:00Z"
    },
    "marketing@flyyy.ai": {
        "user_id": "USR_003",
        "email": "marketing@flyyy.ai",
        "username": "marketing",
        "full_name": "Marketing Lead Alex",
        "role": "MARKETING",
        "password": "marketing123",
        "two_factor_enabled": True,
        "created_at": "2026-09-18T00:00:00Z"
    },
    "auditor@flyyy.ai": {
        "user_id": "USR_004",
        "email": "auditor@flyyy.ai",
        "username": "auditor",
        "full_name": "Compliance Auditor Claire",
        "role": "AUDITOR",
        "password": "auditor123",
        "two_factor_enabled": True,
        "created_at": "2026-09-18T00:00:00Z"
    }
}

# In-memory store for pending 2FA challenges: challenge_id -> { email, code, expires_at }
PENDING_CHALLENGES: Dict[str, dict] = {}


class RegisterRequest(BaseModel):
    full_name: str = Field(..., examples=["Alice Doe"])
    email: str = Field(..., examples=["alice@flyyy.ai"])
    password: str = Field(..., examples=["secret123"])
    role: str = Field(default="PRIVACY_ADMIN", examples=["PRIVACY_ADMIN", "CUSTOMER_SUPPORT", "MARKETING", "AUDITOR"])


class LoginRequest(BaseModel):
    email: str = Field(..., examples=["admin@flyyy.ai"])
    password: str = Field(..., examples=["admin123"])


class Verify2FARequest(BaseModel):
    challenge_id: str = Field(..., examples=["CHAL_12345"])
    code: str = Field(..., examples=["123456"])


def _send_2fa_email(recipient_email: str, code: str):
    """Dispatches a 2FA OTP code over SMTP to Mailpit."""
    try:
        smtp_host = os.getenv("SMTP_HOST", "localhost")
        smtp_port = int(os.getenv("SMTP_PORT", "1025"))

        msg = MIMEText(
            f"Your Two-Factor Authentication (2FA) verification code is:\n\n"
            f"    {code}\n\n"
            f"This code will expire in 10 minutes.\n"
            f"If you did not initiate this login, please notify security@flyyy.ai immediately."
        )
        msg["Subject"] = f"Your Flyyy.AI 2FA Verification Code: {code}"
        msg["From"] = "security@cdp.internal"
        msg["To"] = recipient_email

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.send_message(msg)
    except Exception as e:
        print(f"[WARN] Failed to dispatch 2FA email to Mailpit: {e}")


@router.post("/register")
def register_user(payload: RegisterRequest):
    """Registers a new platform user with specified role and enables 2FA."""
    email_clean = payload.email.strip().lower()
    if email_clean in USER_DATABASE:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    user_id = f"USR_{uuid.uuid4().hex[:6].upper()}"
    new_user = {
        "user_id": user_id,
        "email": email_clean,
        "username": email_clean.split("@")[0],
        "full_name": payload.full_name.strip(),
        "role": payload.role.strip().upper(),
        "password": payload.password,
        "two_factor_enabled": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    USER_DATABASE[email_clean] = new_user

    # Generate initial 2FA code
    code = f"{random.randint(100000, 999999)}"
    challenge_id = f"CHAL_{uuid.uuid4().hex[:8]}"
    PENDING_CHALLENGES[challenge_id] = {
        "email": email_clean,
        "code": code,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10)
    }

    _send_2fa_email(email_clean, code)

    return {
        "status": "REGISTERED",
        "user_id": user_id,
        "email": email_clean,
        "role": new_user["role"],
        "challenge_id": challenge_id,
        "message": f"Account created with role {new_user['role']}. 2FA code sent to {email_clean}."
    }


@router.post("/login")
def login_user(payload: LoginRequest):
    """Authenticates credentials and issues a 2FA challenge with 6-digit OTP."""
    email_clean = payload.email.strip().lower()
    user = USER_DATABASE.get(email_clean)

    if not user or user["password"] != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Generate 6-digit OTP
    code = f"{random.randint(100000, 999999)}"
    challenge_id = f"CHAL_{uuid.uuid4().hex[:8]}"
    PENDING_CHALLENGES[challenge_id] = {
        "email": email_clean,
        "code": code,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10)
    }

    _send_2fa_email(email_clean, code)

    return {
        "status": "2FA_REQUIRED",
        "challenge_id": challenge_id,
        "email": email_clean,
        "user_name": user["full_name"],
        "role": user["role"],
        "demo_code": code,  # Provided for seamless demonstration convenience
        "message": f"2FA code dispatched to {email_clean}. Inspect Mailpit at http://localhost:8025."
    }


@router.post("/verify-2fa")
def verify_2fa(payload: Verify2FARequest):
    """Validates 6-digit 2FA code and issues an authenticated session."""
    challenge = PENDING_CHALLENGES.get(payload.challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired 2FA challenge session."
        )

    # Check expiration
    if datetime.now(timezone.utc) > challenge["expires_at"]:
        del PENDING_CHALLENGES[payload.challenge_id]
        raise HTTPException(status_code=400, detail="2FA verification code has expired.")

    # Validate code (also accepts universal demo fallback '123456')
    entered_code = payload.code.strip()
    if entered_code != challenge["code"] and entered_code != "123456":
        raise HTTPException(status_code=401, detail="Incorrect 2FA verification code.")

    # Successful verification
    user = USER_DATABASE[challenge["email"]]
    del PENDING_CHALLENGES[payload.challenge_id]

    session_token = f"SESS_{uuid.uuid4().hex}"

    return {
        "status": "AUTHENTICATED",
        "session_token": session_token,
        "user": {
            "user_id": user["user_id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "two_factor_verified": True
        }
    }


@router.get("/demo-users")
def get_demo_users():
    """Returns list of pre-configured demo user accounts for easy 1-click login."""
    return [
        {
            "role_name": "Privacy Administrator",
            "role_id": "PRIVACY_ADMIN",
            "email": "admin@flyyy.ai",
            "password": "admin123",
            "description": "Full access to schema discovery, batch pipeline & exception reveals."
        },
        {
            "role_name": "Customer Support Agent",
            "role_id": "CUSTOMER_SUPPORT",
            "email": "support@flyyy.ai",
            "password": "support123",
            "description": "Authorized PII reveal for verified customer tickets."
        },
        {
            "role_name": "Marketing Specialist",
            "role_id": "MARKETING",
            "email": "marketing@flyyy.ai",
            "password": "marketing123",
            "description": "Works exclusively with blind tokens. Plaintext reveal strictly blocked."
        },
        {
            "role_name": "Compliance Auditor",
            "role_id": "AUDITOR",
            "email": "auditor@flyyy.ai",
            "password": "auditor123",
            "description": "Read-only access to immutable audit trails and analytics."
        }
    ]
