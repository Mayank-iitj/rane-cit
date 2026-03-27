"""
cnc-mayyanks-api — TelemetryModule
Telemetry ingest and query for CNC machine sensor data
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta, timezone

from api.database.connection import get_db
from api.database.models import Telemetry, Machine, MachineStatus, User
from api.modules.auth import get_current_user

router = APIRouter(prefix="/api/telemetry", tags=["Telemetry"])


# ═══════════════════════════════════════════════════
# Schemas
# ═══════════════════════════════════════════════════

class TelemetryIngest(BaseModel):
    machine_id: str
    spindle_speed: Optional[float] = None
    feed_rate: Optional[float] = None
    temperature: Optional[float] = None
    vibration: Optional[float] = None
    load_percent: Optional[float] = None
    power_consumption: Optional[float] = None
    tool_id: Optional[str] = None
    tool_wear: Optional[float] = None
    coolant_flow: Optional[float] = None
    coolant_temp: Optional[float] = None
    axis_positions: Optional[dict] = None
    raw_data: Optional[dict] = None
    timestamp: Optional[datetime] = None

class TelemetryBatchIngest(BaseModel):
    data: List[TelemetryIngest]

class TelemetryResponse(BaseModel):
    id: str
    machine_id: str
    timestamp: datetime
    spindle_speed: Optional[float]
    feed_rate: Optional[float]
    temperature: Optional[float]
    vibration: Optional[float]
    load_percent: Optional[float]
    power_consumption: Optional[float]

class TelemetryStats(BaseModel):
    machine_id: str
    period: str
    avg_spindle_speed: Optional[float]
    avg_temperature: Optional[float]
    avg_vibration: Optional[float]
    avg_load: Optional[float]
    max_temperature: Optional[float]
    max_vibration: Optional[float]
    total_energy: Optional[float]
    data_points: int


# ═══════════════════════════════════════════════════
# Routes
# ═══════════════════════════════════════════════════

@router.post("/ingest", status_code=201)
async def ingest_telemetry(
    body: TelemetryIngest,
    db: AsyncSession = Depends(get_db),
):
    """Ingest a single telemetry data point from a CNC machine"""
    record = Telemetry(
        machine_id=body.machine_id,
        timestamp=body.timestamp or datetime.now(timezone.utc),
        spindle_speed=body.spindle_speed,
        feed_rate=body.feed_rate,
        temperature=body.temperature,
        vibration=body.vibration,
        load_percent=body.load_percent,
        power_consumption=body.power_consumption,
        tool_id=body.tool_id,
        tool_wear=body.tool_wear,
        coolant_flow=body.coolant_flow,
        coolant_temp=body.coolant_temp,
        axis_positions=body.axis_positions,
        raw_data=body.raw_data,
    )
    db.add(record)

    # Update machine status to RUNNING
    result = await db.execute(select(Machine).where(Machine.id == body.machine_id))
    machine = result.scalar_one_or_none()
    if machine:
        machine.status = MachineStatus.RUNNING
        machine.last_heartbeat = datetime.now(timezone.utc)

    await db.commit()
    return {"status": "ingested", "id": record.id}


@router.post("/ingest/batch", status_code=201)
async def ingest_telemetry_batch(
    body: TelemetryBatchIngest,
    db: AsyncSession = Depends(get_db),
):
    """Ingest a batch of telemetry data points"""
    records = []
    for item in body.data:
        record = Telemetry(
            machine_id=item.machine_id,
            timestamp=item.timestamp or datetime.now(timezone.utc),
            spindle_speed=item.spindle_speed,
            feed_rate=item.feed_rate,
            temperature=item.temperature,
            vibration=item.vibration,
            load_percent=item.load_percent,
            power_consumption=item.power_consumption,
            tool_id=item.tool_id,
            tool_wear=item.tool_wear,
            coolant_flow=item.coolant_flow,
            coolant_temp=item.coolant_temp,
            axis_positions=item.axis_positions,
            raw_data=item.raw_data,
        )
        records.append(record)
        db.add(record)

    await db.commit()
    return {"status": "ingested", "count": len(records)}


@router.get("/{machine_id}", response_model=List[TelemetryResponse])
async def get_telemetry(
    machine_id: str,
    hours: int = Query(1, ge=1, le=168),
    limit: int = Query(500, ge=1, le=5000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get telemetry data for a machine"""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    result = await db.execute(
        select(Telemetry)
        .where(Telemetry.machine_id == machine_id, Telemetry.timestamp >= since)
        .order_by(Telemetry.timestamp.desc())
        .limit(limit)
    )
    records = result.scalars().all()

    return [
        TelemetryResponse(
            id=r.id, machine_id=r.machine_id, timestamp=r.timestamp,
            spindle_speed=r.spindle_speed, feed_rate=r.feed_rate,
            temperature=r.temperature, vibration=r.vibration,
            load_percent=r.load_percent, power_consumption=r.power_consumption,
        )
        for r in records
    ]


@router.get("/{machine_id}/stats", response_model=TelemetryStats)
async def get_telemetry_stats(
    machine_id: str,
    hours: int = Query(24, ge=1, le=720),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated telemetry statistics"""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    result = await db.execute(
        select(
            func.avg(Telemetry.spindle_speed),
            func.avg(Telemetry.temperature),
            func.avg(Telemetry.vibration),
            func.avg(Telemetry.load_percent),
            func.max(Telemetry.temperature),
            func.max(Telemetry.vibration),
            func.sum(Telemetry.power_consumption),
            func.count(Telemetry.id),
        ).where(Telemetry.machine_id == machine_id, Telemetry.timestamp >= since)
    )
    row = result.one()

    return TelemetryStats(
        machine_id=machine_id,
        period=f"last_{hours}h",
        avg_spindle_speed=round(row[0], 2) if row[0] else None,
        avg_temperature=round(row[1], 2) if row[1] else None,
        avg_vibration=round(row[2], 4) if row[2] else None,
        avg_load=round(row[3], 2) if row[3] else None,
        max_temperature=round(row[4], 2) if row[4] else None,
        max_vibration=round(row[5], 4) if row[5] else None,
        total_energy=round(row[6], 2) if row[6] else None,
        data_points=row[7] or 0,
    )


@router.get("/{machine_id}/latest")
async def get_latest_telemetry(
    machine_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get the latest single telemetry reading"""
    result = await db.execute(
        select(Telemetry).where(Telemetry.machine_id == machine_id)
        .order_by(Telemetry.timestamp.desc()).limit(1)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="No telemetry data found")

    return {
        "machine_id": record.machine_id,
        "timestamp": record.timestamp.isoformat(),
        "spindle_speed": record.spindle_speed,
        "feed_rate": record.feed_rate,
        "temperature": record.temperature,
        "vibration": record.vibration,
        "load_percent": record.load_percent,
        "power_consumption": record.power_consumption,
        "tool_id": record.tool_id,
        "tool_wear": record.tool_wear,
        "coolant_flow": record.coolant_flow,
        "coolant_temp": record.coolant_temp,
        "axis_positions": record.axis_positions,
    }
