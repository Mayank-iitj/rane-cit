"""
Database setup and management for CNC Intelligence Platform
Async SQLAlchemy with PostgreSQL/TimescaleDB support
"""

import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy import event
import asyncpg

from app.config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy declarative base
Base = declarative_base()

# Engine and session factory
_engine: AsyncEngine = None
_async_session_maker: async_sessionmaker = None


async def init_db() -> None:
    """Initialize database connection and create tables"""
    global _engine, _async_session_maker

    logger.info(f"Initializing database: {settings.DATABASE_URL}")

    # Create async engine
    _engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        future=True,
        pool_size=20,
        max_overflow=10,
    )

    # Create session maker
    _async_session_maker = async_sessionmaker(
        _engine, class_=AsyncSession, expire_on_commit=False
    )

    # Create tables
    async with _engine.begin() as conn:
        logger.info("Creating database tables...")
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")

    logger.info("Database initialization complete")


async def close_db() -> None:
    """Close database connection"""
    global _engine, _async_session_maker

    if _engine:
        await _engine.dispose()
        _engine = None
        _async_session_maker = None
        logger.info("Database connection closed")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get async database session (dependency injection)"""
    if _async_session_maker is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    async with _async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


async def init_timescale() -> None:
    """Initialize TimescaleDB extension for high-frequency telemetry"""
    logger.info("Initializing TimescaleDB...")

    try:
        conn = await asyncpg.connect(
            user=settings.TIMESCALE_URL.split("://")[1].split(":")[0],
            password=settings.TIMESCALE_URL.split(":")[1].split("@")[0],
            database=settings.TIMESCALE_URL.split("/")[-1],
            host=settings.TIMESCALE_URL.split("@")[1].split(":")[0],
            port=int(settings.TIMESCALE_URL.split(":")[-1].split("/")[0]),
        )

        # Enable TimescaleDB extension
        await conn.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")
        logger.info("TimescaleDB extension enabled")

        await conn.close()
    except Exception as e:
        logger.warning(f"TimescaleDB initialization failed (may already be enabled): {e}")


class DatabaseManager:
    """Wrapper for database operations"""

    @staticmethod
    async def init() -> None:
        """Initialize all database resources"""
        await init_db()
        await init_timescale()

    @staticmethod
    async def close() -> None:
        """Close all database resources"""
        await close_db()

    @staticmethod
    async def health_check() -> bool:
        """Check database health"""
        try:
            async for session in get_session():
                await session.execute("SELECT 1")
                return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
