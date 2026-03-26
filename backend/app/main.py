"""
CNC Intelligence Platform - Main FastAPI Application
Production-ready backend with multi-tenant support, real-time ML inference, and streaming
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import DatabaseManager, get_session
from app.services.event_bus import init_event_bus, close_event_bus, get_event_bus
from app.services.alert_dispatcher import init_alert_dispatcher, get_alert_dispatcher
from app.api import predictions, anomalies, optimization, websocket, machines

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - startup and shutdown"""
    logger.info("=" * 60)
    logger.info("CNC Intelligence Platform starting up...")
    logger.info("=" * 60)

    try:
        # Initialize database
        logger.info("Initializing database...")
        await DatabaseManager.init()
        logger.info("✓ Database initialized")

        # Initialize event bus (Kafka/MQTT)
        logger.info("Initializing event streaming...")
        await init_event_bus()
        logger.info("✓ Event bus initialized")

        # Initialize alert dispatcher
        logger.info("Initializing alert dispatcher...")
        init_alert_dispatcher()
        logger.info("✓ Alert dispatcher initialized")

        # Pre-load ML models
        logger.info("Loading ML models...")
        from app.ml.models.lstm_model import get_lstm_model
        from app.ml.models.xgb_model import get_xgb_model
        from app.ml.models.anomaly import get_anomaly_detector
        from app.ml.models.optimizer import get_parameter_optimizer

        get_lstm_model()
        get_xgb_model()
        get_anomaly_detector()
        get_parameter_optimizer()
        logger.info("✓ ML models loaded")

        # Initialize data simulator
        logger.info("Initializing data simulator...")
        from app.services.data_simulator import get_simulator

        get_simulator()
        logger.info("✓ Data simulator initialized")

        logger.info("=" * 60)
        logger.info("✓ CNC Intelligence Platform ready!")
        logger.info("=" * 60)

        yield

    except Exception as e:
        logger.error(f"Startup failed: {e}", exc_info=True)
        raise

    finally:
        logger.info("=" * 60)
        logger.info("CNC Intelligence Platform shutting down...")
        logger.info("=" * 60)

        try:
            # Close event bus
            await close_event_bus()
            logger.info("✓ Event bus closed")

            # Close database
            await DatabaseManager.close()
            logger.info("✓ Database closed")

            logger.info("✓ Shutdown complete")
            logger.info("=" * 60)

        except Exception as e:
            logger.error(f"Error during shutdown: {e}", exc_info=True)


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered CNC Process Intelligence & Optimization Platform",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Middleware: CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware: Trusted hosts (security)
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.example.com"],
    )

# Include routers
logger.info("Registering API routes...")
app.include_router(predictions.router)
app.include_router(anomalies.router)
app.include_router(optimization.router)
app.include_router(websocket.router)
app.include_router(machines.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
        "api_version": "/api/v1",
    }


@app.get("/api/v1")
async def api_root():
    """API v1 root"""
    return {
        "message": "CNC Intelligence Platform API",
        "version": "1.0.0",
        "endpoints": {
            "machines": "/api/v1/machines",
            "predictions": "/api/v1/predict/tool-health",
            "anomalies": "/api/v1/detect/anomaly",
            "optimization": "/api/v1/optimize/parameters",
            "alerts": "/api/v1/alerts",
            "dashboard": "/api/v1/dashboard/stats",
            "live_stream": "/api/v1/stream/live (WebSocket)",
            "docs": "/docs",
        },
    }


@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    try:
        db_healthy = await DatabaseManager.health_check()
        event_bus = get_event_bus()
        alert_dispatcher = get_alert_dispatcher()

        return {
            "status": "healthy" if db_healthy else "degraded",
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
            "services": {
                "database": "operational" if db_healthy else "offline",
                "event_bus": "operational",
                "alert_dispatcher": "operational",
                "ml_models": "operational",
                "api": "operational",
            },
            "version": settings.APP_VERSION,
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
        }


@app.get("/health/ready")
async def readiness_check():
    """Kubernetes-style readiness probe"""
    try:
        db_healthy = await DatabaseManager.health_check()
        return {"ready": db_healthy}
    except Exception:
        return {"ready": False}, 503


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
    )