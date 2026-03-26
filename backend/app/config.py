"""
Configuration management for CNC Intelligence Platform
Supports environment-based configuration with secure secrets handling
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Application
    APP_NAME: str = "CNC Intelligence Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, alias="DEBUG")
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://cnc_user:cnc_password@localhost:5432/cnc_db",
        alias="DATABASE_URL"
    )
    TIMESCALE_URL: str = Field(
        default="postgresql+asyncpg://cnc_user:cnc_password@localhost:5432/cnc_timescale",
        alias="TIMESCALE_URL"
    )

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    REDIS_CACHE_EXPIRY: int = 300  # seconds

    # Authentication & Security
    SECRET_KEY: str = Field(default="dev-secret-change-in-prod", alias="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_ISSUER: str = "cnc-platform"

    # CORS
    CORS_ORIGINS: list = ["*"]

    # Streaming
    KAFKA_BROKERS: str = Field(default="localhost:9092", alias="KAFKA_BROKERS")
    KAFKA_TOPIC_TELEMETRY: str = "cnc-telemetry"
    KAFKA_TOPIC_PREDICTIONS: str = "cnc-predictions"
    KAFKA_TOPIC_ALERTS: str = "cnc-alerts"

    # MQTT (fallback for edge devices)
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""

    # ML Models
    MODELS_DIR: str = "models"
    MODEL_CHECKPOINT_INTERVAL: int = 3600  # seconds
    TRAINING_BATCH_SIZE: int = 32
    INFERENCE_BATCH_SIZE: int = 64

    # Features
    ENABLE_DIGITAL_TWIN: bool = False
    ENABLE_COPILOT: bool = False
    ENABLE_GCODE_OPTIMIZER: bool = False
    ENABLE_ROI_ANALYTICS: bool = True

    # Alerting
    ALERT_EMAIL_ENABLED: bool = False
    ALERT_EMAIL_FROM: str = ""
    ALERT_TWILIO_ENABLED: bool = False
    ALERT_TWILIO_ACCOUNT_SID: str = ""
    ALERT_TWILIO_AUTH_TOKEN: str = ""
    ALERT_TWILIO_PHONE: str = ""

    # Multi-tenancy
    ENABLE_MULTI_TENANT: bool = True
    DEFAULT_TENANT_ID: str = "default"

    # Demo/Simulation
    ENABLE_SIMULATOR: bool = True
    SIMULATOR_MACHINE_COUNT: int = 4

    class Config:
        env_file = ".env"
        case_sensitive = True

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Optional[str]) -> list:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


def get_settings() -> Settings:
    """Get application settings"""
    return settings


# Global settings instance
settings = Settings()
