"""
CNC Intelligence Platform - Database Models
Using SQLAlchemy ORM with TimescaleDB for time-series data
Multi-tenant architecture for factory/plant scalability
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, 
    BigInteger, Index, UniqueConstraint, JSON, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID
import uuid
from enum import Enum

from app.database import Base


class StatusEnum(str, Enum):
    """Machine status enumeration"""
    RUNNING = "running"
    IDLE = "idle"
    FAULT = "fault"
    MAINTENANCE = "maintenance"


class SeverityEnum(str, Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class Tenant(Base):
    """Tenant (Factory/Plant) entity for multi-tenancy"""
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True, index=True)

    # Relationships
    machines = relationship("CNCMachine", back_populates="tenant", cascade="all, delete-orphan")
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="tenant", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_tenant_name", "name"),
        Index("idx_tenant_active", "is_active"),
    )


class User(Base):
    """User entity with tenant association"""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False, index=True)
    username = Column(String(100), nullable=False, index=True)
    email = Column(String(255), nullable=False)
    roles = Column(JSON, default=["viewer"])  # ["admin", "operator", "technician", "viewer"]
    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, index=True)

    # Relationships
    tenant = relationship("Tenant", back_populates="users")

    __table_args__ = (
        UniqueConstraint("tenant_id", "username", name="uq_tenant_username"),
        Index("idx_user_tenant", "tenant_id"),
    )


class CNCMachine(Base):
    """CNC Machine entity with tenant association"""
    __tablename__ = "cnc_machines"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False, index=True)
    machine_name = Column(String(100), nullable=False, index=True)
    controller_type = Column(String(50))  # "Fanuc", "Siemens", "Haas", etc.
    status = Column(SQLEnum(StatusEnum), default=StatusEnum.IDLE, index=True)
    location = Column(String(200))
    metadata = Column(JSON, default={})  # Custom fields, MTConnect ID, OPC-UA endpoint, etc.
    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_data_received = Column(TIMESTAMP)

    # Relationships
    tenant = relationship("Tenant", back_populates="machines")
    sensor_data = relationship("SensorData", back_populates="machine", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="machine", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="machine", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="machine", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("tenant_id", "machine_name", name="uq_tenant_machine"),
        Index("idx_machine_tenant", "tenant_id"),
        Index("idx_machine_status", "status"),
    )


class SensorData(Base):
    """Time-series sensor data from CNC machines (TimescaleDB hypertable)"""
    __tablename__ = "sensor_data"

    id = Column(BigInteger, primary_key=True)
    machine_id = Column(String(36), ForeignKey("cnc_machines.id"), nullable=False, index=True)
    tool_id = Column(String(50), index=True)
    timestamp = Column(TIMESTAMP, nullable=False, index=True)

    # Sensor readings
    spindle_speed = Column(Float)  # RPM
    feed_rate = Column(Float)  # mm/min
    vibration_x = Column(Float)
    vibration_y = Column(Float)
    vibration_z = Column(Float)
    vibration_rms = Column(Float)  # RMS of vibrations
    acoustic_emission = Column(Float)
    temperature = Column(Float)  # Celsius
    power_consumption = Column(Float)  # kW
    axis_load_percent = Column(Float)  # Load on axes

    # Relationship
    machine = relationship("CNCMachine", back_populates="sensor_data")

    __table_args__ = (
        Index("idx_sensor_machine_time", "machine_id", "timestamp"),
        Index("idx_sensor_timestamp", "timestamp"),
    )


class Prediction(Base):
    """Tool wear and RUL predictions"""
    __tablename__ = "predictions"

    id = Column(BigInteger, primary_key=True)
    machine_id = Column(String(36), ForeignKey("cnc_machines.id"), nullable=False, index=True)
    tool_id = Column(String(50), index=True)
    timestamp = Column(TIMESTAMP, nullable=False, index=True)

    # Predictions
    rul_minutes = Column(Float)  # Remaining useful life in minutes
    health_score = Column(Float)  # 0-100
    confidence = Column(Float)  # 0-1
    model_used = Column(String(20))  # lstm, xgboost, ensemble
    model_version = Column(String(20))

    # Relationship
    machine = relationship("CNCMachine", back_populates="predictions")

    __table_args__ = (
        Index("idx_pred_machine_time", "machine_id", "timestamp"),
    )


class Anomaly(Base):
    """Detected anomalies in machining operations"""
    __tablename__ = "anomalies"

    id = Column(BigInteger, primary_key=True)
    machine_id = Column(String(36), ForeignKey("cnc_machines.id"), nullable=False, index=True)
    tool_id = Column(String(50), index=True)
    timestamp = Column(TIMESTAMP, nullable=False, index=True)

    # Anomaly detection results
    anomaly_flag = Column(Boolean, default=False, index=True)
    anomaly_score = Column(Float)  # 0-1
    severity = Column(SQLEnum(SeverityEnum), index=True)
    anomaly_type = Column(String(50))  # tool_breakage, overload, abnormal_vibration, etc.
    description = Column(Text)

    # Relationship
    machine = relationship("CNCMachine", back_populates="anomalies")

    __table_args__ = (
        Index("idx_anomaly_machine_time", "machine_id", "timestamp"),
        Index("idx_anomaly_flag", "anomaly_flag"),
    )


class Recommendation(Base):
    """Optimization recommendations for machining parameters"""
    __tablename__ = "recommendations"

    id = Column(BigInteger, primary_key=True)
    machine_id = Column(String(36), ForeignKey("cnc_machines.id"), nullable=False, index=True)
    timestamp = Column(TIMESTAMP, nullable=False, index=True)

    # Current vs recommended parameters
    current_feed_rate = Column(Float)
    recommended_feed_rate = Column(Float)
    current_spindle_speed = Column(Float)
    recommended_spindle_speed = Column(Float)

    # Analysis
    efficiency_gain = Column(Float)  # percentage
    reason = Column(Text)
    priority = Column(String(20))  # low, medium, high

    # Relationship
    machine = relationship("CNCMachine", back_populates="recommendations")

    __table_args__ = (
        Index("idx_rec_machine_time", "machine_id", "timestamp"),
    )


class Alert(Base):
    """System alerts for operators with tenant association"""
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False, index=True)
    machine_id = Column(String(36), ForeignKey("cnc_machines.id"), nullable=False, index=True)
    timestamp = Column(TIMESTAMP, nullable=False, index=True)

    # Alert details
    alert_type = Column(String(50))  # anomaly, tool_wear, optimization, maintenance
    severity = Column(SQLEnum(SeverityEnum), index=True)
    title = Column(String(200))
    message = Column(Text)
    acknowledged = Column(Boolean, default=False, index=True)
    acknowledged_by = Column(String(100))
    acknowledged_at = Column(TIMESTAMP)

    # Notification channels
    sent_email = Column(Boolean, default=False)
    sent_sms = Column(Boolean, default=False)
    sent_dashboard = Column(Boolean, default=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="alerts")

    __table_args__ = (
        Index("idx_alert_tenant", "tenant_id"),
        Index("idx_alert_machine", "machine_id"),
        Index("idx_alert_timestamp", "timestamp"),
        Index("idx_alert_ack", "acknowledged"),
    )


class OptimizationJob(Base):
    """Batch optimization job tracking"""
    __tablename__ = "optimization_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False, index=True)
    machine_id = Column(String(36), ForeignKey("cnc_machines.id"), index=True)
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    job_type = Column(String(50))  # param_optimization, tool_wear_prediction, etc.
    config = Column(JSON)
    result = Column(JSON)
    started_at = Column(TIMESTAMP)
    completed_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_job_tenant", "tenant_id"),
        Index("idx_job_status", "status"),
    )