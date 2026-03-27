"""
cnc-mayyanks-api — AuthModule
JWT authentication with refresh tokens, API key support, rate limiting
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib
import secrets
import bcrypt
import jwt

from api.config import settings
from api.database.connection import get_db
from api.database.models import User, Organization, APIKey, AuditLog, UserRole

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


# ═══════════════════════════════════════════════════
# Schemas
# ═══════════════════════════════════════════════════

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str
    org_name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict

class RefreshRequest(BaseModel):
    refresh_token: str

class APIKeyCreateRequest(BaseModel):
    name: str
    machine_id: Optional[str] = None
    scopes: list = ["telemetry:write"]

class APIKeyResponse(BaseModel):
    id: str
    name: str
    key: str  # Only returned on creation
    scopes: list
    created_at: datetime


# ═══════════════════════════════════════════════════
# Token Utilities
# ═══════════════════════════════════════════════════

def create_access_token(user_id: str, org_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "org_id": org_id,
        "role": role,
        "iss": settings.JWT_ISSUER,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iss": settings.JWT_ISSUER,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            issuer=settings.JWT_ISSUER,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency: extract and validate current user from JWT or API key"""

    # Check API key header first
    api_key = request.headers.get(settings.API_KEY_HEADER) if request else None
    if api_key:
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        result = await db.execute(select(APIKey).where(APIKey.key_hash == key_hash, APIKey.is_active == True))
        key_record = result.scalar_one_or_none()
        if not key_record:
            raise HTTPException(status_code=401, detail="Invalid API key")
        # Update last used
        key_record.last_used = datetime.now(timezone.utc)
        await db.commit()
        # Return a synthetic user for API key auth
        result = await db.execute(select(User).where(User.org_id == key_record.org_id).limit(1))
        user = result.scalar_one_or_none()
        if user:
            return user
        raise HTTPException(status_code=401, detail="API key org not found")

    # JWT Bearer token
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    payload = verify_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


# ═══════════════════════════════════════════════════
# Routes
# ═══════════════════════════════════════════════════

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT tokens"""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    access_token = create_access_token(user.id, user.org_id, user.role.value)
    refresh_token = create_refresh_token(user.id)

    # Audit log
    audit = AuditLog(
        user_id=user.id, org_id=user.org_id,
        action="auth.login", resource_type="user", resource_id=user.id
    )
    db.add(audit)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={"id": user.id, "email": user.email, "role": user.role.value, "name": user.full_name}
    )


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user (creates org if org_name provided)"""
    # Check existing
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create org if needed
    org_name = body.org_name or f"{body.full_name}'s Organization"
    org = Organization(
        name=org_name,
        slug=org_name.lower().replace(" ", "-").replace("'", ""),
    )
    db.add(org)
    await db.flush()

    # Create user
    password_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    user = User(
        email=body.email,
        password_hash=password_hash,
        full_name=body.full_name,
        role=UserRole.ADMIN,
        org_id=org.id,
    )
    db.add(user)
    await db.commit()

    access_token = create_access_token(user.id, user.org_id, user.role.value)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={"id": user.id, "email": user.email, "role": user.role.value, "name": user.full_name}
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh an access token"""
    payload = verify_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token(user.id, user.org_id, user.role.value)
    new_refresh = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={"id": user.id, "email": user.email, "role": user.role.value, "name": user.full_name}
    )


@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    body: APIKeyCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new API key for machine authentication"""
    raw_key = f"cnc_mayyanks_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

    api_key = APIKey(
        key_hash=key_hash,
        name=body.name,
        org_id=current_user.org_id,
        machine_id=body.machine_id,
        scopes=body.scopes,
    )
    db.add(api_key)
    await db.commit()

    return APIKeyResponse(
        id=api_key.id, name=api_key.name, key=raw_key,
        scopes=api_key.scopes, created_at=api_key.created_at
    )


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "org_id": current_user.org_id,
    }
