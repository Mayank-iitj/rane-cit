"""
cnc-mayyanks-api — Security Middleware
Production-grade security middleware stack
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import uuid
import logging

logger = logging.getLogger("cnc-mayyanks-api")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add production security headers to all responses"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["X-Request-ID"] = request.state.request_id if hasattr(request.state, "request_id") else str(uuid.uuid4())
        if not request.url.path.startswith("/docs"):
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        return response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique request ID for tracing"""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all API requests with timing"""

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration = (time.perf_counter() - start) * 1000

        if not request.url.path.startswith(("/health", "/docs", "/openapi")):
            logger.info(
                "%s %s %d %.1fms",
                request.method,
                request.url.path,
                response.status_code,
                duration,
            )

        response.headers["X-Response-Time"] = f"{duration:.1f}ms"
        return response


class GlobalErrorMiddleware(BaseHTTPMiddleware):
    """Catch unhandled exceptions and return clean JSON errors"""

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:
            logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
            return Response(
                content='{"detail":"Internal server error","service":"cnc-mayyanks-api"}',
                status_code=500,
                media_type="application/json",
            )
