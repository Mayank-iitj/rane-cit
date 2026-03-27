"""
cnc-mayyanks-api — AlertModule
Alert management with severity, acknowledgment, real-time dispatch
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta, timezone

from api.database.connection import get_db
from api.database.models import Alert, AlertSeverity, AlertType, User
from api.modules.auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


class AlertCreate(BaseModel):
    machine_id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    message: Optional[str] = None
    metric_name: Optional[str] = None
    metric_value: Optional[float] = None
    threshold_value: Optional[float] = None

class AlertResponse(BaseModel):
    id: str
    machine_id: str
    type: str
    severity: str
    title: str
    message: Optional[str]
    metric_name: Optional[str]
    metric_value: Optional[float]
    is_acknowledged: bool
    created_at: datetime

class AlertStats(BaseModel):
    total: int
    critical: int
    warning: int
    info: int
    unacknowledged: int


@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    severity: Optional[AlertSeverity] = None,
    acknowledged: Optional[bool] = None,
    machine_id: Optional[str] = None,
    hours: int = Query(24, ge=1, le=720),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List alerts for the organization"""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    query = select(Alert).where(Alert.org_id == current_user.org_id, Alert.created_at >= since)

    if severity:
        query = query.where(Alert.severity == severity)
    if acknowledged is not None:
        query = query.where(Alert.is_acknowledged == acknowledged)
    if machine_id:
        query = query.where(Alert.machine_id == machine_id)

    query = query.order_by(Alert.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    alerts = result.scalars().all()

    return [
        AlertResponse(
            id=a.id, machine_id=a.machine_id, type=a.type.value,
            severity=a.severity.value, title=a.title, message=a.message,
            metric_name=a.metric_name, metric_value=a.metric_value,
            is_acknowledged=a.is_acknowledged, created_at=a.created_at,
        )
        for a in alerts
    ]


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(
    body: AlertCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new alert (used by ML service and ingestion pipeline)"""
    # Determine org_id from machine
    from api.database.models import Machine
    result = await db.execute(select(Machine).where(Machine.id == body.machine_id))
    machine = result.scalar_one_or_none()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    alert = Alert(
        machine_id=body.machine_id,
        org_id=machine.org_id,
        type=body.type,
        severity=body.severity,
        title=body.title,
        message=body.message,
        metric_name=body.metric_name,
        metric_value=body.metric_value,
        threshold_value=body.threshold_value,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    return AlertResponse(
        id=alert.id, machine_id=alert.machine_id, type=alert.type.value,
        severity=alert.severity.value, title=alert.title, message=alert.message,
        metric_name=alert.metric_name, metric_value=alert.metric_value,
        is_acknowledged=alert.is_acknowledged, created_at=alert.created_at,
    )


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Acknowledge an alert"""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.org_id == current_user.org_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_acknowledged = True
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.now(timezone.utc)
    await db.commit()

    return {"status": "acknowledged", "alert_id": alert_id}


@router.get("/stats", response_model=AlertStats)
async def get_alert_stats(
    hours: int = Query(24, ge=1, le=720),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get alert statistics"""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    base = select(func.count(Alert.id)).where(
        Alert.org_id == current_user.org_id, Alert.created_at >= since
    )

    total = (await db.execute(base)).scalar() or 0
    critical = (await db.execute(base.where(Alert.severity == AlertSeverity.CRITICAL))).scalar() or 0
    warning = (await db.execute(base.where(Alert.severity == AlertSeverity.WARNING))).scalar() or 0
    info = (await db.execute(base.where(Alert.severity == AlertSeverity.INFO))).scalar() or 0
    unack = (await db.execute(base.where(Alert.is_acknowledged == False))).scalar() or 0

    return AlertStats(total=total, critical=critical, warning=warning, info=info, unacknowledged=unack)
