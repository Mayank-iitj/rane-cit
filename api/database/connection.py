"""
cnc-mayyanks-api — Database Connection Manager
PostgreSQL + TimescaleDB async connection with health checks
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
import logging

from api.config import settings

logger = logging.getLogger("cnc-mayyanks-api.database")


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all cnc-mayyanks models"""
    pass


class DatabaseManager:
    """Async database connection manager for cnc-mayyanks-api"""

    _engine = None
    _session_factory = None

    @classmethod
    async def init(cls):
        """Initialize database engine and session factory"""
        cls._engine = create_async_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG,
            pool_size=20,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
        cls._session_factory = async_sessionmaker(
            cls._engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        logger.info(f"[cnc-mayyanks-api] Database engine initialized")

        # Create tables
        async with cls._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"[cnc-mayyanks-api] Database tables created/verified")

    @classmethod
    async def close(cls):
        """Close database engine"""
        if cls._engine:
            await cls._engine.dispose()
            logger.info("[cnc-mayyanks-api] Database connection closed")

    @classmethod
    async def get_session(cls) -> AsyncSession:
        """Get a new async session"""
        if cls._session_factory is None:
            await cls.init()
        return cls._session_factory()

    @classmethod
    async def health_check(cls) -> bool:
        """Check database connectivity"""
        try:
            async with cls._engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"[cnc-mayyanks-api] Database health check failed: {e}")
            return False


async def get_db():
    """FastAPI dependency — yields an async database session"""
    session = await DatabaseManager.get_session()
    try:
        yield session
    finally:
        await session.close()
