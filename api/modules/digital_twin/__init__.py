"""
cnc-mayyanks-api — DigitalTwinModule
CNC machine digital twin simulation with real-time data feed
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import math
import random

from api.database.connection import get_db
from api.database.models import Machine, Telemetry, User
from api.modules.auth import get_current_user

router = APIRouter(prefix="/api/digital-twin", tags=["Digital Twin"])


class TwinState(BaseModel):
    machine_id: str
    machine_name: str
    timestamp: str
    # Spindle
    spindle_speed_rpm: float
    spindle_load_percent: float
    spindle_temperature_c: float
    # Axes
    x_position_mm: float
    y_position_mm: float
    z_position_mm: float
    x_velocity_mm_s: float
    y_velocity_mm_s: float
    z_velocity_mm_s: float
    # Tool
    tool_id: str
    tool_wear_percent: float
    tool_life_remaining_min: float
    # Coolant
    coolant_flow_lpm: float
    coolant_temp_c: float
    # Overall
    power_consumption_w: float
    vibration_mm_s: float
    status: str
    health_score: float

class SimulateRequest(BaseModel):
    machine_id: str
    duration_seconds: int = 60
    scenario: str = "normal"  # normal, degrading, failure, high_load

class SimulationResult(BaseModel):
    machine_id: str
    scenario: str
    duration_seconds: int
    data_points: int
    summary: dict
    timeline: List[dict]


@router.get("/{machine_id}", response_model=TwinState)
async def get_digital_twin(
    machine_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current digital twin state of a machine"""
    result = await db.execute(
        select(Machine).where(Machine.id == machine_id, Machine.org_id == current_user.org_id)
    )
    machine = result.scalar_one_or_none()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    # Get latest telemetry
    tel_result = await db.execute(
        select(Telemetry).where(Telemetry.machine_id == machine_id)
        .order_by(Telemetry.timestamp.desc()).limit(1)
    )
    latest = tel_result.scalar_one_or_none()

    # Build twin state from real data or simulation
    now = datetime.now(timezone.utc)
    if latest:
        # Real data available
        health = 100.0
        if latest.vibration and latest.vibration > 5.0:
            health -= 20
        if latest.temperature and latest.temperature > 70:
            health -= 15
        if latest.tool_wear and latest.tool_wear > 80:
            health -= 25

        return TwinState(
            machine_id=machine.id,
            machine_name=machine.name,
            timestamp=now.isoformat(),
            spindle_speed_rpm=latest.spindle_speed or 0,
            spindle_load_percent=latest.load_percent or 0,
            spindle_temperature_c=latest.temperature or 25.0,
            x_position_mm=(latest.axis_positions or {}).get("x", 0),
            y_position_mm=(latest.axis_positions or {}).get("y", 0),
            z_position_mm=(latest.axis_positions or {}).get("z", 0),
            x_velocity_mm_s=random.uniform(0, 50),
            y_velocity_mm_s=random.uniform(0, 50),
            z_velocity_mm_s=random.uniform(0, 20),
            tool_id=latest.tool_id or "T01",
            tool_wear_percent=latest.tool_wear or 0.0,
            tool_life_remaining_min=max(0, (100 - (latest.tool_wear or 0)) * 4.5),
            coolant_flow_lpm=latest.coolant_flow or 15.0,
            coolant_temp_c=latest.coolant_temp or 22.0,
            power_consumption_w=latest.power_consumption or 0,
            vibration_mm_s=latest.vibration or 0,
            status=machine.status.value,
            health_score=max(0, health),
        )
    else:
        # Simulated idle state
        return TwinState(
            machine_id=machine.id,
            machine_name=machine.name,
            timestamp=now.isoformat(),
            spindle_speed_rpm=0,
            spindle_load_percent=0,
            spindle_temperature_c=25.0,
            x_position_mm=0, y_position_mm=0, z_position_mm=0,
            x_velocity_mm_s=0, y_velocity_mm_s=0, z_velocity_mm_s=0,
            tool_id="T01",
            tool_wear_percent=0,
            tool_life_remaining_min=450,
            coolant_flow_lpm=0,
            coolant_temp_c=22.0,
            power_consumption_w=50,
            vibration_mm_s=0.1,
            status=machine.status.value,
            health_score=100.0,
        )


@router.post("/simulate", response_model=SimulationResult)
async def simulate_machine(
    body: SimulateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run a digital twin simulation for a machine"""
    result = await db.execute(
        select(Machine).where(Machine.id == body.machine_id, Machine.org_id == current_user.org_id)
    )
    machine = result.scalar_one_or_none()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    timeline = []
    t = 0
    base_spindle = 3000
    base_temp = 35.0
    base_vibration = 1.5
    base_load = 65
    tool_wear = 10.0

    for step in range(0, body.duration_seconds, max(1, body.duration_seconds // 60)):
        t_ratio = step / body.duration_seconds

        if body.scenario == "normal":
            spindle = base_spindle + random.gauss(0, 50)
            temp = base_temp + t_ratio * 5 + random.gauss(0, 1)
            vibration = base_vibration + random.gauss(0, 0.2)
            load = base_load + random.gauss(0, 3)
            tool_wear += 0.1
        elif body.scenario == "degrading":
            spindle = base_spindle - t_ratio * 500 + random.gauss(0, 80)
            temp = base_temp + t_ratio * 25 + random.gauss(0, 2)
            vibration = base_vibration + t_ratio * 6 + random.gauss(0, 0.5)
            load = base_load + t_ratio * 20 + random.gauss(0, 5)
            tool_wear += 0.5 * (1 + t_ratio)
        elif body.scenario == "failure":
            if t_ratio < 0.7:
                spindle = base_spindle + random.gauss(0, 100)
                temp = base_temp + t_ratio * 15 + random.gauss(0, 2)
                vibration = base_vibration + t_ratio * 4 + random.gauss(0, 0.3)
                load = base_load + t_ratio * 10
            else:
                spindle = base_spindle * (1 - (t_ratio - 0.7) * 3) + random.gauss(0, 200)
                temp = base_temp + 40 + random.gauss(0, 5)
                vibration = 12 + random.gauss(0, 3)
                load = 95 + random.gauss(0, 5)
            tool_wear += 1.0 * (1 + t_ratio * 2)
        elif body.scenario == "high_load":
            spindle = base_spindle * 1.3 + random.gauss(0, 60)
            temp = base_temp + 20 + t_ratio * 10 + random.gauss(0, 2)
            vibration = base_vibration * 1.5 + random.gauss(0, 0.4)
            load = 85 + random.gauss(0, 5)
            tool_wear += 0.3
        else:
            spindle = base_spindle
            temp = base_temp
            vibration = base_vibration
            load = base_load

        timeline.append({
            "time_s": step,
            "spindle_speed": round(max(0, spindle), 1),
            "temperature": round(max(20, temp), 2),
            "vibration": round(max(0, vibration), 3),
            "load_percent": round(min(100, max(0, load)), 1),
            "tool_wear": round(min(100, tool_wear), 1),
            "power_w": round(max(0, load * 25 + random.gauss(0, 50)), 1),
        })

    # Summary
    avg_spindle = sum(p["spindle_speed"] for p in timeline) / max(len(timeline), 1)
    max_temp = max(p["temperature"] for p in timeline)
    max_vib = max(p["vibration"] for p in timeline)
    avg_load = sum(p["load_percent"] for p in timeline) / max(len(timeline), 1)

    return SimulationResult(
        machine_id=body.machine_id,
        scenario=body.scenario,
        duration_seconds=body.duration_seconds,
        data_points=len(timeline),
        summary={
            "avg_spindle_speed": round(avg_spindle, 1),
            "max_temperature": round(max_temp, 1),
            "max_vibration": round(max_vib, 3),
            "avg_load": round(avg_load, 1),
            "final_tool_wear": timeline[-1]["tool_wear"] if timeline else 0,
            "failure_detected": body.scenario == "failure" and max_vib > 10,
        },
        timeline=timeline,
    )
