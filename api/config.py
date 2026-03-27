"""
cnc-mayyanks-api — Configuration Management
Production config for cnc.mayyanks.app
"""

import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings — branded for cnc.mayyanks.app"""

    # ── Identity ──
    APP_NAME: str = "cnc-mayyanks-api"
    APP_TITLE: str = "CNC Mayyanks Intelligence Platform"
    APP_VERSION: str = "1.0.0"
    APP_DOMAIN: str = "cnc.mayyanks.app"
    API_BASE_URL: str = "https://cnc.mayyanks.app/api"
    DEBUG: bool = Field(default=False)
    LOG_LEVEL: str = "INFO"

    # ── Database — PostgreSQL + TimescaleDB ──
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://cnc_mayyanks:cnc_secret@localhost:5432/cnc_mayyanks_db"
    )
    TIMESCALE_URL: str = Field(
        default="postgresql+asyncpg://cnc_mayyanks:cnc_secret@localhost:5432/cnc_mayyanks_db"
    )

    # ── Redis ──
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    REDIS_CACHE_TTL: int = 300

    # ── Authentication ──
    SECRET_KEY: str = Field(default="cnc-mayyanks-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "cnc-mayyanks"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    API_KEY_HEADER: str = "X-CNC-API-Key"

    # ── Google OAuth 2.0 ──
    GOOGLE_CLIENT_ID: str = Field(default="")
    GOOGLE_CLIENT_SECRET: str = Field(default="")
    GOOGLE_REDIRECT_URI: str = Field(default="https://cnc.mayyanks.app/api/auth/google/callback")

    # ── CORS ──
    CORS_ORIGINS: List[str] = ["https://cnc.mayyanks.app", "http://localhost:3000"]

    # ── Security ──
    RATE_LIMIT_PER_MINUTE: int = 100
    MAX_REQUEST_SIZE_MB: int = 50
    TRUSTED_HOSTS: List[str] = ["cnc.mayyanks.app", "localhost", "127.0.0.1"]

    # ── Kafka ──
    KAFKA_BROKERS: str = Field(default="localhost:9092")
    KAFKA_TOPIC_TELEMETRY_RAW: str = "cnc.telemetry.raw"
    KAFKA_TOPIC_TELEMETRY_PROCESSED: str = "cnc.telemetry.processed"
    KAFKA_TOPIC_ALERTS: str = "cnc.alerts"

    # ── MQTT ──
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883

    # ── Internal Service URLs ──
    ML_SERVICE_URL: str = "http://cnc-mayyanks-ml-service:8001"
    REALTIME_SERVICE_URL: str = "http://cnc-mayyanks-realtime:8002"
    INGESTION_SERVICE_URL: str = "http://cnc-mayyanks-ingestion:8003"

    # ── Feature Flags ──
    ENABLE_DIGITAL_TWIN: bool = True
    ENABLE_COPILOT: bool = True
    ENABLE_GCODE_OPTIMIZER: bool = True
    ENABLE_ENERGY_TRACKING: bool = True
    ENABLE_SIMULATOR: bool = True
    SIMULATOR_MACHINE_COUNT: int = 4

    # ── Multi-tenancy ──
    ENABLE_MULTI_TENANT: bool = True
    DEFAULT_TENANT_ID: str = "cnc-mayyanks-default"

    # ── Alerting ──
    ALERT_WEBHOOK_URL: str = ""
    ALERT_EMAIL_ENABLED: bool = False
    ALERT_EMAIL_FROM: str = "alerts@cnc.mayyanks.app"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",")]
        return v


settings = Settings()
