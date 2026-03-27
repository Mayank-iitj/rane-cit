"""
CNC Intelligence Platform - Pydantic Schemas
Request/Response validation for API endpoints
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# === Request Schemas ===

class ToolHealthRequest(BaseModel):
    """Request for tool health prediction"""
    spindle_speed: float = Field(..., description="Spindle speed in RPM")
    feed_rate: float = Field(..., description="Feed rate in mm/min")
    vibration: float = Field(..., description="Vibration RMS")
    temperature: float = Field(..., description="Temperature in Celsius")
    acoustic_emission: float = Field(..., description="Acoustic emission value")
    tool_id: str = Field(..., description="Tool identifier")


class AnomalyDetectionRequest(BaseModel):
    """Request for anomaly detection"""
    vibration_x: float
    vibration_y: float
    vibration_z: float
    temperature: float
    acoustic_emission: float
    tool_id: Optional[str] = None


class ParameterOptimizationRequest(BaseModel):
    """Request for parameter optimization"""
    current_feed_rate: float = Field(..., description="Current feed rate in mm/min")
    current_spindle_speed: float = Field(..., description="Current spindle speed in RPM")
    tool_health: float = Field(..., description="Current tool health score (0-100)")


class SensorDataRequest(BaseModel):
    """Incoming sensor data from MQTT"""
    machine_id: int
    tool_id: str
    spindle_speed: float
    feed_rate: float
    vibration_x: float
    vibration_y: float
    vibration_z: float
    acoustic_emission: float
    temperature: float
    power_consumption: Optional[float] = None


# === Response Schemas ===

class ToolHealthResponse(BaseModel):
    """Response for tool health prediction"""
    rul_minutes: float = Field(..., description="Remaining Useful Life in minutes")
    health_score: float = Field(..., description="Tool health score (0-100)")
    confidence: float = Field(..., description="Model confidence (0-1)")
    model_used: str = Field(..., description="Model used for prediction")


class AnomalyDetectionResponse(BaseModel):
    """Response for anomaly detection"""
    anomaly_flag: bool = Field(..., description="Whether anomaly detected")
    anomaly_score: float = Field(..., description="Anomaly score (-1 to 1)")
    severity: str = Field(..., description="Severity level: low, medium, high, critical")
    anomaly_type: Optional[str] = Field(None, description="Type of anomaly detected")


class ParameterOptimizationResponse(BaseModel):
    """Response for parameter optimization"""
    recommended_feed_rate: float = Field(..., description="Recommended feed rate")
    recommended_spindle_speed: float = Field(..., description="Recommended spindle speed")
    efficiency_gain: float = Field(..., description="Expected efficiency gain (%)")
    reason: str = Field(..., description="Explanation for recommendations")


class MachineStatus(BaseModel):
    """CNC Machine status"""
    id: int
    machine_name: str
    status: str  # running, idle, fault
    location: Optional[str] = None
    current_tool_health: Optional[float] = None
    last_update: Optional[datetime] = None


class DashboardStats(BaseModel):
    """Dashboard statistics"""
    total_machines: int
    active_machines: int
    idle_machines: int
    fault_machines: int
    alerts_today: int
    avg_health: float
    estimated_savings: float  # $/day
    downtime_reduction: float  # percentage
    tool_life_improvement: float  # percentage


class LiveData(BaseModel):
    """Live streaming data for WebSocket"""
    timestamp: datetime
    machine_id: int
    machine_name: str
    spindle_speed: float
    feed_rate: float
    vibration_rms: float
    temperature: float
    health_score: float
    rul_minutes: float
    anomaly_flag: bool
    anomaly_score: float
    recommended_feed_rate: float
    recommended_spindle_speed: float


class AlertResponse(BaseModel):
    """Alert response"""
    id: int
    machine_id: int
    machine_name: str
    timestamp: datetime
    alert_type: str
    severity: str
    title: str
    message: str
    acknowledged: bool


class RecommendationResponse(BaseModel):
    """Recommendation response"""
    id: int
    machine_id: int
    timestamp: datetime
    current_feed_rate: float
    recommended_feed_rate: float
    current_spindle_speed: float
    recommended_spindle_speed: float
    efficiency_gain: float
    reason: str


# === Demo Mode ===

class DemoModeRequest(BaseModel):
    """Set demo mode"""
    mode: str = Field(..., description="normal, degradation, anomaly")
    machine_id: Optional[int] = None