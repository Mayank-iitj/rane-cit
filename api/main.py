"""
cnc-mayyanks-api — Main Entrypoint
Production FastAPI application for cnc.mayyanks.app
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from api.config import settings
from api.database.connection import DatabaseManager

logging.basicConfig(level=settings.LOG_LEVEL, format="%(asctime)s [cnc-mayyanks-api] %(levelname)s %(message)s")
logger = logging.getLogger("cnc-mayyanks-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle"""
    logger.info("=" * 60)
    logger.info("🚀 cnc-mayyanks-api starting — cnc.mayyanks.app")
    logger.info("=" * 60)

    try:
        await DatabaseManager.init()
        logger.info("✓ Database initialized (PostgreSQL + TimescaleDB)")

        # Seed demo data if simulator enabled
        if settings.ENABLE_SIMULATOR:
            from api.seed import seed_demo_data
            await seed_demo_data()
            logger.info("✓ Demo data seeded")

        logger.info("=" * 60)
        logger.info("✓ cnc-mayyanks-api is READY at %s", settings.API_BASE_URL)
        logger.info("=" * 60)
        yield

    except Exception as e:
        logger.error(f"Startup failed: {e}", exc_info=True)
        raise
    finally:
        await DatabaseManager.close()
        logger.info("cnc-mayyanks-api shutdown complete")


# ═══════════════════════════════════════════════════
# Create App
# ═══════════════════════════════════════════════════

app = FastAPI(
    title="cnc-mayyanks-api",
    description="CNC Intelligence Platform — Real-time CNC Process Intelligence & Predictive Automation (cnc.mayyanks.app)",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    servers=[
        {"url": "https://cnc.mayyanks.app", "description": "Production"},
        {"url": "http://localhost:8000", "description": "Development"},
    ],
)

# ── Middleware Stack (order matters — outermost first) ──
from api.middleware import (
    SecurityHeadersMiddleware,
    RequestIDMiddleware,
    RequestLoggingMiddleware,
    GlobalErrorMiddleware,
)

# Error handler (outermost — catches everything)
app.add_middleware(GlobalErrorMiddleware)

# Security headers
app.add_middleware(SecurityHeadersMiddleware)

# Request ID tracing
app.add_middleware(RequestIDMiddleware)

# Request logging
app.add_middleware(RequestLoggingMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted hosts (production only)
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.TRUSTED_HOSTS,
    )

# ═══════════════════════════════════════════════════
# Register Module Routers
# ═══════════════════════════════════════════════════

from api.modules.auth import router as auth_router
from api.modules.auth.google_oauth import router as google_router
from api.modules.machines import router as machines_router
from api.modules.telemetry import router as telemetry_router
from api.modules.analytics import router as analytics_router
from api.modules.alerts import router as alerts_router
from api.modules.gcode import router as gcode_router
from api.modules.tenant import router as tenant_router
from api.modules.copilot import router as copilot_router
from api.modules.digital_twin import router as digital_twin_router

app.include_router(auth_router)
app.include_router(google_router)
app.include_router(machines_router)
app.include_router(telemetry_router)
app.include_router(analytics_router)
app.include_router(alerts_router)
app.include_router(gcode_router)
app.include_router(tenant_router)
app.include_router(copilot_router)
app.include_router(digital_twin_router)


# ═══════════════════════════════════════════════════
# Root & Health Endpoints
# ═══════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "name": "cnc-mayyanks-api",
        "product": "cnc.mayyanks.app",
        "version": settings.APP_VERSION,
        "description": "CNC Intelligence & Predictive Automation Platform",
        "docs": "/docs",
        "api": "/api",
    }


@app.get("/api")
async def api_root():
    return {
        "service": "cnc-mayyanks-api",
        "domain": "cnc.mayyanks.app",
        "version": "1.0.0",
        "endpoints": {
            "auth": {
                "login": "POST /api/auth/login",
                "register": "POST /api/auth/register",
                "google_login": "GET /api/auth/google/login",
                "google_verify": "POST /api/auth/google/verify-token",
                "refresh": "POST /api/auth/refresh",
                "me": "GET /api/auth/me",
                "api_keys": "POST /api/auth/api-keys",
            },
            "machines": {
                "list": "GET /api/machines",
                "create": "POST /api/machines",
                "detail": "GET /api/machines/:id",
                "heartbeat": "POST /api/machines/:id/heartbeat",
            },
            "telemetry": {
                "ingest": "POST /api/telemetry/ingest",
                "batch_ingest": "POST /api/telemetry/ingest/batch",
                "query": "GET /api/telemetry/:machine_id",
                "stats": "GET /api/telemetry/:machine_id/stats",
                "latest": "GET /api/telemetry/:machine_id/latest",
            },
            "analytics": {
                "oee": "GET /api/analytics/oee",
                "fleet": "GET /api/analytics/fleet",
                "downtime": "GET /api/analytics/downtime",
                "energy": "GET /api/analytics/energy",
            },
            "alerts": {
                "list": "GET /api/alerts",
                "create": "POST /api/alerts",
                "acknowledge": "POST /api/alerts/:id/acknowledge",
                "stats": "GET /api/alerts/stats",
            },
            "gcode": {
                "analyze": "POST /api/gcode/analyze",
                "optimize": "POST /api/gcode/optimize",
                "programs": "GET /api/gcode/programs",
            },
            "digital_twin": {
                "state": "GET /api/digital-twin/:machine_id",
                "simulate": "POST /api/digital-twin/simulate",
            },
            "copilot": {
                "ask": "POST /api/copilot/ask",
                "suggestions": "GET /api/copilot/suggestions/:machine_id",
            },
            "tenants": {
                "list": "GET /api/tenants",
                "create": "POST /api/tenants",
                "detail": "GET /api/tenants/:id",
            },
        },
    }


@app.get("/health")
async def health():
    db_ok = await DatabaseManager.health_check()
    return {
        "status": "healthy" if db_ok else "degraded",
        "service": "cnc-mayyanks-api",
        "database": "ok" if db_ok else "down",
        "version": settings.APP_VERSION,
    }


@app.get("/health/ready")
async def readiness():
    db_ok = await DatabaseManager.health_check()
    return {"ready": db_ok}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
