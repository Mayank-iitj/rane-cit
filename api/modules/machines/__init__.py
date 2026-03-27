"""
cnc-mayyanks-api — MachineModule
CNC machine CRUD, status tracking, org assignment
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone

from api.database.connection import get_db
from api.database.models import Machine, MachineStatus, Telemetry, Alert, User
from api.modules.auth import get_current_user

router = APIRouter(prefix="/api/machines", tags=["Machines"])


# ═══════════════════════════════════════════════════
# Schemas
# ═══════════════════════════════════════════════════

class MachineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    serial_number: Optional[str] = None
    location: Optional[str] = None
    protocol: str = "mqtt"
    connection_config: dict = {}

class MachineUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[MachineStatus] = None
    location: Optional[str] = None
    connection_config: Optional[dict] = None

class MachineResponse(BaseModel):
    id: str
    name: str
    model: Optional[str]
    manufacturer: Optional[str]
    serial_number: Optional[str]
    org_id: str
    status: str
    location: Optional[str]
    protocol: str
    last_heartbeat: Optional[datetime]
    created_at: datetime

class MachineDetailResponse(MachineResponse):
    connection_config: dict
    latest_telemetry: Optional[dict] = None
    active_alerts: int = 0
    uptime_percent: float = 0.0


# ═══════════════════════════════════════════════════
# Routes
# ═══════════════════════════════════════════════════

@router.post("", response_model=MachineResponse, status_code=201)
async def create_machine(
    body: MachineCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register a new CNC machine"""
    machine = Machine(
        name=body.name,
        model=body.model,
        manufacturer=body.manufacturer,
        serial_number=body.serial_number,
        org_id=current_user.org_id,
        location=body.location,
        protocol=body.protocol,
        connection_config=body.connection_config,
    )
    db.add(machine)
    await db.commit()
    await db.refresh(machine)

    return MachineResponse(
        id=machine.id, name=machine.name, model=machine.model,
        manufacturer=machine.manufacturer, serial_number=machine.serial_number,
        org_id=machine.org_id, status=machine.status.value,
        location=machine.location, protocol=machine.protocol,
        last_heartbeat=machine.last_heartbeat, created_at=machine.created_at,
    )


@router.get("", response_model=List[MachineResponse])
async def list_machines(
    status: Optional[MachineStatus] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all machines in the organization"""
    query = select(Machine).where(Machine.org_id == current_user.org_id)
    if status:
        query = query.where(Machine.status == status)
    query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    machines = result.scalars().all()

    return [
        MachineResponse(
            id=m.id, name=m.name, model=m.model,
            manufacturer=m.manufacturer, serial_number=m.serial_number,
            org_id=m.org_id, status=m.status.value,
            location=m.location, protocol=m.protocol,
            last_heartbeat=m.last_heartbeat, created_at=m.created_at,
        )
        for m in machines
    ]


@router.get("/{machine_id}", response_model=MachineDetailResponse)
async def get_machine(
    machine_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get machine details with latest telemetry and alert count"""
    result = await db.execute(
        select(Machine).where(Machine.id == machine_id, Machine.org_id == current_user.org_id)
    )
    machine = result.scalar_one_or_none()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    # Latest telemetry
    tel_result = await db.execute(
        select(Telemetry).where(Telemetry.machine_id == machine_id)
        .order_by(Telemetry.timestamp.desc()).limit(1)
    )
    latest = tel_result.scalar_one_or_none()
    latest_data = None
    if latest:
        latest_data = {
            "spindle_speed": latest.spindle_speed,
            "feed_rate": latest.feed_rate,
            "temperature": latest.temperature,
            "vibration": latest.vibration,
            "load_percent": latest.load_percent,
            "power_consumption": latest.power_consumption,
            "timestamp": latest.timestamp.isoformat() if latest.timestamp else None,
        }

    # Active alert count
    alert_result = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.machine_id == machine_id,
            Alert.is_acknowledged == False
        )
    )
    active_alerts = alert_result.scalar() or 0

    return MachineDetailResponse(
        id=machine.id, name=machine.name, model=machine.model,
        manufacturer=machine.manufacturer, serial_number=machine.serial_number,
        org_id=machine.org_id, status=machine.status.value,
        location=machine.location, protocol=machine.protocol,
        last_heartbeat=machine.last_heartbeat, created_at=machine.created_at,
        connection_config=machine.connection_config or {},
        latest_telemetry=latest_data, active_alerts=active_alerts,
    )


@router.patch("/{machine_id}", response_model=MachineResponse)
async def update_machine(
    machine_id: str,
    body: MachineUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update machine details"""
    result = await db.execute(
        select(Machine).where(Machine.id == machine_id, Machine.org_id == current_user.org_id)
    )
    machine = result.scalar_one_or_none()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(machine, key, value)
    machine.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(machine)

    return MachineResponse(
        id=machine.id, name=machine.name, model=machine.model,
        manufacturer=machine.manufacturer, serial_number=machine.serial_number,
        org_id=machine.org_id, status=machine.status.value,
        location=machine.location, protocol=machine.protocol,
        last_heartbeat=machine.last_heartbeat, created_at=machine.created_at,
    )


@router.delete("/{machine_id}", status_code=204)
async def delete_machine(
    machine_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a machine"""
    result = await db.execute(
        select(Machine).where(Machine.id == machine_id, Machine.org_id == current_user.org_id)
    )
    machine = result.scalar_one_or_none()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    await db.delete(machine)
    await db.commit()


@router.post("/{machine_id}/heartbeat")
async def machine_heartbeat(
    machine_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Update machine heartbeat (called by edge agent)"""
    await db.execute(
        update(Machine).where(Machine.id == machine_id).values(
            last_heartbeat=datetime.now(timezone.utc),
            status=MachineStatus.ONLINE,
        )
    )
    await db.commit()
    return {"status": "ok", "machine_id": machine_id}
