"""
cnc-mayyanks-api — Google OAuth Module
Google Sign-In / OAuth 2.0 integration for cnc.mayyanks.app
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime, timezone
import httpx
import secrets

from api.config import settings
from api.database.connection import get_db
from api.database.models import User, Organization, UserRole, AuditLog
from api.modules.auth import create_access_token, create_refresh_token

router = APIRouter(prefix="/api/auth/google", tags=["Google OAuth"])

# Google OAuth Config — from centralized Settings
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


class GoogleTokenRequest(BaseModel):
    """For frontend-initiated Google Sign-In (ID token from Google JS SDK)"""
    id_token: str

class GoogleAuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict
    is_new_user: bool


# ═══════════════════════════════════════════════════
# Server-side OAuth Flow (redirect-based)
# ═══════════════════════════════════════════════════

@router.get("/login")
async def google_login():
    """Redirect to Google OAuth consent screen"""
    state = secrets.token_urlsafe(32)
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{query}")


@router.get("/callback")
async def google_callback(code: str, state: str = "", db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback"""
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })

    if token_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange Google auth code")

    tokens = token_resp.json()
    google_access_token = tokens.get("access_token")

    # Get user info
    async with httpx.AsyncClient() as client:
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {google_access_token}"}
        )

    if userinfo_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get Google user info")

    google_user = userinfo_resp.json()
    user, is_new = await _find_or_create_google_user(google_user, db)

    access_token = create_access_token(user.id, user.org_id, user.role.value)
    refresh_token = create_refresh_token(user.id)

    # Redirect to frontend with tokens (env-aware)
    base = settings.APP_DOMAIN
    scheme = "http" if settings.DEBUG else "https"
    frontend_url = f"{scheme}://{base}/auth/callback?access_token={access_token}&refresh_token={refresh_token}&new_user={is_new}"
    return RedirectResponse(frontend_url)


# ═══════════════════════════════════════════════════
# Client-side token verification (Google Sign-In JS SDK)
# ═══════════════════════════════════════════════════

@router.post("/verify-token", response_model=GoogleAuthResponse)
async def verify_google_token(body: GoogleTokenRequest, db: AsyncSession = Depends(get_db)):
    """Verify a Google ID token from the frontend JS SDK and issue JWT"""
    # Verify the ID token with Google
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={body.id_token}"
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google ID token")

    token_info = resp.json()

    # Verify audience matches our client ID
    if token_info.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Token not issued for this application")

    google_user = {
        "email": token_info.get("email"),
        "name": token_info.get("name", token_info.get("email", "").split("@")[0]),
        "picture": token_info.get("picture"),
        "id": token_info.get("sub"),
    }

    user, is_new = await _find_or_create_google_user(google_user, db)

    access_token = create_access_token(user.id, user.org_id, user.role.value)
    refresh_token = create_refresh_token(user.id)

    return GoogleAuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.full_name,
            "role": user.role.value,
            "org_id": user.org_id,
        },
        is_new_user=is_new,
    )


# ═══════════════════════════════════════════════════
# Helper: Find or create user from Google profile
# ═══════════════════════════════════════════════════

async def _find_or_create_google_user(google_user: dict, db: AsyncSession) -> tuple:
    """Find existing user by email or create new one with Google info"""
    email = google_user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        # Existing user — update last login
        user.last_login = datetime.now(timezone.utc)
        await db.commit()
        return user, False

    # New user — create org + user
    name = google_user.get("name", email.split("@")[0])
    org = Organization(
        name=f"{name}'s Organization",
        slug=email.split("@")[0].lower().replace(".", "-") + "-org",
    )
    db.add(org)
    await db.flush()

    user = User(
        email=email,
        password_hash="google_oauth_no_password",  # No password for OAuth users
        full_name=name,
        role=UserRole.ADMIN,
        org_id=org.id,
        last_login=datetime.now(timezone.utc),
    )
    db.add(user)

    # Audit
    audit = AuditLog(
        user_id=user.id, org_id=org.id,
        action="auth.google_signup",
        resource_type="user", resource_id=user.id,
        details={"provider": "google", "email": email},
    )
    db.add(audit)
    await db.commit()
    await db.refresh(user)

    return user, True
