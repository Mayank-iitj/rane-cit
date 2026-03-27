"""
cnc-mayyanks-api — Database Models
All SQLAlchemy ORM models for the CNC Intelligence Platform
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, Enum, ForeignKey,
    Index, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid

from api.database.connection import Base


def gen_uuid():
    return str(uuid.uuid4())


# ═══════════════════════════════════════════════════
# Enums
# ═══════════════════════════════════════════════════

class MachineStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    RUNNING = "running"
    IDLE = "idle"
    MAINTENANCE = "maintenance"
    ERROR = "error"


class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class AlertType(str, enum.Enum):
    ANOMALY = "anomaly"
    THRESHOLD = "threshold"
    PREDICTIVE = "predictive"
    MAINTENANCE = "maintenance"
    ENERGY = "energy"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"
    API_KEY = "api_key"


# ═══════════════════════════════════════════════════
# Organizations (Multi-tenant)
# ═══════════════════════════════════════════════════

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    plan = Column(String(50), default="starter")
    max_machines = Column(Integer, default=10)
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="organization")
    machines = relationship("Machine", back_populates="organization")


# ═══════════════════════════════════════════════════
# Users
# ═══════════════════════════════════════════════════

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.OPERATOR)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="users")

    __table_args__ = (
        Index("ix_users_org_email", "org_id", "email"),
    )


# ═══════════════════════════════════════════════════
# API Keys (for machines and integrations)
# ═══════════════════════════════════════════════════

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=gen_uuid)
    key_hash = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=True)
    scopes = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ═══════════════════════════════════════════════════
# Machines
# ═══════════════════════════════════════════════════

class Machine(Base):
    __tablename__ = "machines"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    model = Column(String(255))
    manufacturer = Column(String(255))
    serial_number = Column(String(100))
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    status = Column(Enum(MachineStatus), default=MachineStatus.OFFLINE)
    location = Column(String(255))
    protocol = Column(String(50), default="mqtt")  # mqtt, mtconnect, opcua
    connection_config = Column(JSON, default=dict)
    metadata_ = Column("metadata", JSON, default=dict)
    last_heartbeat = Column(DateTime(timezone=True))
    installed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="machines")
    telemetry = relationship("Telemetry", back_populates="machine", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="machine", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_machines_org_status", "org_id", "status"),
        UniqueConstraint("org_id", "serial_number", name="uq_machine_serial"),
    )


# ═══════════════════════════════════════════════════
# Telemetry (TimescaleDB hypertable)
# ═══════════════════════════════════════════════════

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(String, primary_key=True, default=gen_uuid)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    spindle_speed = Column(Float)
    feed_rate = Column(Float)
    temperature = Column(Float)
    vibration = Column(Float)
    load_percent = Column(Float)
    power_consumption = Column(Float)
    tool_id = Column(String(50))
    tool_wear = Column(Float)
    coolant_flow = Column(Float)
    coolant_temp = Column(Float)
    axis_positions = Column(JSON)  # {"x": 0.0, "y": 0.0, "z": 0.0}
    raw_data = Column(JSON)

    # Relationships
    machine = relationship("Machine", back_populates="telemetry")

    __table_args__ = (
        Index("ix_telemetry_machine_time", "machine_id", "timestamp"),
    )


# ═══════════════════════════════════════════════════
# Alerts
# ═══════════════════════════════════════════════════

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=gen_uuid)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text)
    metric_name = Column(String(100))
    metric_value = Column(Float)
    threshold_value = Column(Float)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    machine = relationship("Machine", back_populates="alerts")

    __table_args__ = (
        Index("ix_alerts_org_severity", "org_id", "severity"),
        Index("ix_alerts_machine_time", "machine_id", "created_at"),
    )


# ═══════════════════════════════════════════════════
# G-code Programs
# ═══════════════════════════════════════════════════

class GCodeProgram(Base):
    __tablename__ = "gcode_programs"

    id = Column(String, primary_key=True, default=gen_uuid)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    filename = Column(String(255))
    content = Column(Text)
    line_count = Column(Integer)
    analysis = Column(JSON)  # parsed analysis results
    optimizations = Column(JSON)  # suggested optimizations
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ═══════════════════════════════════════════════════
# Audit Log
# ═══════════════════════════════════════════════════

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100))
    resource_id = Column(String)
    details = Column(JSON)
    ip_address = Column(String(45))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_audit_org_time", "org_id", "timestamp"),
    )
