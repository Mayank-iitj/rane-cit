"""
Machine service for data persistence and retrieval
"""

import logging
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cnc_models import CNCMachine, SensorData, Prediction, Anomaly, Alert, Tenant
from app.schemas.cnc_schemas import MachineStatus, AlertResponse

logger = logging.getLogger(__name__)


class MachineService:
    """Service for machine operations"""

    @staticmethod
    async def create_machine(
        session: AsyncSession,
        tenant_id: str,
        machine_name: str,
        controller_type: str = None,
        location: str = None,
        metadata: dict = None,
    ) -> CNCMachine:
        """Create a new CNC machine"""
        machine = CNCMachine(
            tenant_id=tenant_id,
            machine_name=machine_name,
            controller_type=controller_type,
            location=location,
            metadata=metadata or {},
        )
        session.add(machine)
        await session.flush()
        logger.info(f"Machine created: {machine.id} ({machine_name})")
        return machine

    @staticmethod
    async def get_machine(
        session: AsyncSession,
        machine_id: str,
        tenant_id: str = None,
    ) -> Optional[CNCMachine]:
        """Get machine by ID"""
        stmt = select(CNCMachine).where(CNCMachine.id == machine_id)
        if tenant_id:
            stmt = stmt.where(CNCMachine.tenant_id == tenant_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_machines_by_tenant(
        session: AsyncSession,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[CNCMachine]:
        """Get all machines for a tenant"""
        stmt = (
            select(CNCMachine)
            .where(CNCMachine.tenant_id == tenant_id)
            .order_by(CNCMachine.machine_name)
            .offset(skip)
            .limit(limit)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def update_machine_status(
        session: AsyncSession,
        machine_id: str,
        status: str,
    ) -> Optional[CNCMachine]:
        """Update machine status"""
        machine = await session.get(CNCMachine, machine_id)
        if machine:
            machine.status = status
            machine.updated_at = datetime.utcnow()
            await session.flush()
            logger.info(f"Machine {machine_id} status updated to {status}")
        return machine

    @staticmethod
    async def update_machine_last_data(
        session: AsyncSession,
        machine_id: str,
    ) -> Optional[CNCMachine]:
        """Update machine last_data_received timestamp"""
        machine = await session.get(CNCMachine, machine_id)
        if machine:
            machine.last_data_received = datetime.utcnow()
            await session.flush()
        return machine


class SensorDataService:
    """Service for sensor data operations"""

    @staticmethod
    async def add_sensor_data(
        session: AsyncSession,
        machine_id: str,
        tool_id: str,
        timestamp: datetime,
        spindle_speed: float,
        feed_rate: float,
        vibration_x: float,
        vibration_y: float,
        vibration_z: float,
        vibration_rms: float,
        acoustic_emission: float,
        temperature: float,
        power_consumption: float,
        axis_load_percent: float = None,
    ) -> SensorData:
        """Add sensor data record"""
        sensor_data = SensorData(
            machine_id=machine_id,
            tool_id=tool_id,
            timestamp=timestamp,
            spindle_speed=spindle_speed,
            feed_rate=feed_rate,
            vibration_x=vibration_x,
            vibration_y=vibration_y,
            vibration_z=vibration_z,
            vibration_rms=vibration_rms,
            acoustic_emission=acoustic_emission,
            temperature=temperature,
            power_consumption=power_consumption,
            axis_load_percent=axis_load_percent,
        )
        session.add(sensor_data)
        return sensor_data

    @staticmethod
    async def get_recent_sensor_data(
        session: AsyncSession,
        machine_id: str,
        minutes: int = 10,
        limit: int = 1000,
    ) -> List[SensorData]:
        """Get recent sensor data for a machine"""
        since = datetime.utcnow() - timedelta(minutes=minutes)
        stmt = (
            select(SensorData)
            .where(
                and_(
                    SensorData.machine_id == machine_id,
                    SensorData.timestamp >= since,
                )
            )
            .order_by(desc(SensorData.timestamp))
            .limit(limit)
        )
        result = await session.execute(stmt)
        return result.scalars().all()


class PredictionService:
    """Service for prediction storage and retrieval"""

    @staticmethod
    async def save_prediction(
        session: AsyncSession,
        machine_id: str,
        tool_id: str,
        rul_minutes: float,
        health_score: float,
        confidence: float,
        model_used: str = "ensemble",
        model_version: str = None,
    ) -> Prediction:
        """Save RUL prediction"""
        prediction = Prediction(
            machine_id=machine_id,
            tool_id=tool_id,
            timestamp=datetime.utcnow(),
            rul_minutes=rul_minutes,
            health_score=health_score,
            confidence=confidence,
            model_used=model_used,
            model_version=model_version,
        )
        session.add(prediction)
        return prediction

    @staticmethod
    async def get_latest_prediction(
        session: AsyncSession,
        machine_id: str,
    ) -> Optional[Prediction]:
        """Get latest prediction for a machine"""
        stmt = (
            select(Prediction)
            .where(Prediction.machine_id == machine_id)
            .order_by(desc(Prediction.timestamp))
            .limit(1)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


class AnomalyService:
    """Service for anomaly detection results"""

    @staticmethod
    async def save_anomaly(
        session: AsyncSession,
        machine_id: str,
        tool_id: str,
        anomaly_flag: bool,
        anomaly_score: float,
        severity: str,
        anomaly_type: str,
        description: str = None,
    ) -> Anomaly:
        """Save anomaly detection result"""
        anomaly = Anomaly(
            machine_id=machine_id,
            tool_id=tool_id,
            timestamp=datetime.utcnow(),
            anomaly_flag=anomaly_flag,
            anomaly_score=anomaly_score,
            severity=severity,
            anomaly_type=anomaly_type,
            description=description,
        )
        session.add(anomaly)
        return anomaly

    @staticmethod
    async def get_recent_anomalies(
        session: AsyncSession,
        machine_id: str,
        hours: int = 24,
    ) -> List[Anomaly]:
        """Get recent anomalies for a machine"""
        since = datetime.utcnow() - timedelta(hours=hours)
        stmt = (
            select(Anomaly)
            .where(
                and_(
                    Anomaly.machine_id == machine_id,
                    Anomaly.timestamp >= since,
                    Anomaly.anomaly_flag == True,
                )
            )
            .order_by(desc(Anomaly.timestamp))
        )
        result = await session.execute(stmt)
        return result.scalars().all()


class AlertService:
    """Service for alert management"""

    @staticmethod
    async def create_alert(
        session: AsyncSession,
        tenant_id: str,
        machine_id: str,
        alert_type: str,
        severity: str,
        title: str,
        message: str,
    ) -> Alert:
        """Create a new alert"""
        alert = Alert(
            tenant_id=tenant_id,
            machine_id=machine_id,
            timestamp=datetime.utcnow(),
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
        )
        session.add(alert)
        return alert

    @staticmethod
    async def get_unacknowledged_alerts(
        session: AsyncSession,
        tenant_id: str,
        limit: int = 50,
    ) -> List[Alert]:
        """Get unacknowledged alerts for a tenant"""
        stmt = (
            select(Alert)
            .where(
                and_(
                    Alert.tenant_id == tenant_id,
                    Alert.acknowledged == False,
                )
            )
            .order_by(desc(Alert.timestamp))
            .limit(limit)
        )
        result = await session.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def acknowledge_alert(
        session: AsyncSession,
        alert_id: str,
        acknowledged_by: str,
    ) -> Optional[Alert]:
        """Acknowledge an alert"""
        alert = await session.get(Alert, alert_id)
        if alert:
            alert.acknowledged = True
            alert.acknowledged_by = acknowledged_by
            alert.acknowledged_at = datetime.utcnow()
            await session.flush()
        return alert
