"""
Authentication and authorization module
JWT token management and role-based access control
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from enum import Enum

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import jwt

from app.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer()


class UserRole(str, Enum):
    """User roles for RBAC"""
    ADMIN = "admin"
    OPERATOR = "operator"
    TECHNICIAN = "technician"
    VIEWER = "viewer"


class TokenData:
    """Token payload data"""

    def __init__(
        self,
        user_id: str,
        username: str,
        tenant_id: str = settings.DEFAULT_TENANT_ID,
        roles: List[str] = None,
        permissions: List[str] = None,
    ):
        self.user_id = user_id
        self.username = username
        self.tenant_id = tenant_id
        self.roles = roles or [UserRole.VIEWER]
        self.permissions = permissions or []


class AuthManager:
    """Handle JWT token generation and verification"""

    @staticmethod
    def create_token(
        user_id: str,
        username: str,
        tenant_id: str = settings.DEFAULT_TENANT_ID,
        roles: List[str] = None,
        expires_delta: Optional[timedelta] = None,
    ) -> Dict[str, str]:
        """Create JWT access token"""
        if expires_delta is None:
            expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        expire = datetime.utcnow() + expires_delta

        payload = {
            "sub": user_id,
            "username": username,
            "tenant_id": tenant_id,
            "roles": roles or [UserRole.VIEWER],
            "exp": expire,
            "iat": datetime.utcnow(),
            "iss": settings.JWT_ISSUER,
        }

        encoded_jwt = jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )

        return {
            "access_token": encoded_jwt,
            "token_type": "bearer",
            "expires_in": int(expires_delta.total_seconds()),
        }

    @staticmethod
    def verify_token(token: str) -> TokenData:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
                issuer=settings.JWT_ISSUER,
            )

            user_id = payload.get("sub")
            username = payload.get("username")
            tenant_id = payload.get("tenant_id", settings.DEFAULT_TENANT_ID)
            roles = payload.get("roles", [UserRole.VIEWER])

            if user_id is None or username is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token claims",
                )

            return TokenData(
                user_id=user_id,
                username=username,
                tenant_id=tenant_id,
                roles=roles,
            )

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
            )
        except jwt.InvalidTokenError as e:
            logger.error(f"Token validation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )


async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
) -> TokenData:
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    return AuthManager.verify_token(token)


def require_role(*allowed_roles: UserRole):
    """Dependency to require specific user roles"""

    async def check_role(user: TokenData = Depends(get_current_user)) -> TokenData:
        if not any(role in user.roles for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return check_role


def require_admin(user: TokenData = Depends(get_current_user)) -> TokenData:
    """Dependency to require admin role"""
    if UserRole.ADMIN not in user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return user


def require_operator(user: TokenData = Depends(get_current_user)) -> TokenData:
    """Dependency to require operator or above"""
    allowed = {UserRole.ADMIN, UserRole.OPERATOR, UserRole.TECHNICIAN}
    if not any(role in user.roles for role in allowed):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator role or above required",
        )
    return user
