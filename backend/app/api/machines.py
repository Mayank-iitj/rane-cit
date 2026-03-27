"""
CNC Intelligence Platform - Machines and Dashboard APIs
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import random
import logging

from app.schemas.cnc_schemas import (
    MachineStatus, DashboardStats, AlertResponse, RecommendationResponse
)
from app.services.data_simulator import get_simulator, DemoMode, CNCDataSimulator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["machines", "dashboard"])


# In-memory machine data (would be from database in production)
MACHINES = [
    {"id": 1, "name": "CNC-Alpha", "status": "running", "location": "Building A, Line 1"},
    {"id": 2, "name": "CNC-Beta", "status": "running", "location": "Building A, Line 2"},
    {"id": 3, "name": "CNC-Gamma", "status": "idle", "location": "Building B, Line 1"},
    {"id": 4, "name": "CNC-Delta", "status": "running", "location": "Building B, Line 2"},
]


@router.get("/machines", response_model=List[MachineStatus])
async def get_machines() -> List[Dict]:
    """Get all CNC machines with current status"""
    simulator = get_simulator()

    machines_with_health = []
    for machine in MACHINES:
        sample = simulator.generate_sample(machine["id"])
        machines_with_health.append({
            "id": machine["id"],
            "machine_name": machine["name"],
            "status": sample["status"],
            "location": machine["location"],
            "current_tool_health": sample["health_score"],
            "last_update": datetime.utcnow()
        })

    return machines_with_health


@router.get("/machines/{machine_id}", response_model=MachineStatus)
async def get_machine(machine_id: int) -> Dict:
    """Get specific machine status"""
    machine = next((m for m in MACHINES if m["id"] == machine_id), None)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    simulator = get_simulator()
    sample = simulator.generate_sample(machine_id)

    return {
        "id": machine["id"],
        "machine_name": machine["name"],
        "status": sample["status"],
        "location": machine["location"],
        "current_tool_health": sample["health_score"],
        "last_update": datetime.utcnow()
    }


@router.post("/machines/{machine_id}/status")
async def update_machine_status(machine_id: int, status: str) -> Dict:
    """Update machine status"""
    machine = next((m for m in MACHINES if m["id"] == machine_id), None)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    if status not in ["running", "idle", "fault"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    machine["status"] = status
    return {"id": machine_id, "status": status, "updated": True}


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats() -> Dict:
    """Get dashboard statistics"""
    simulator = get_simulator()

    # Calculate stats from simulator
    active_count = sum(1 for m in MACHINES if m["status"] == "running")
    idle_count = sum(1 for m in MACHINES if m["status"] == "idle")
    fault_count = sum(1 for m in MACHINES if m["status"] == "fault")

    # Sample health from each machine
    health_values = []
    for machine in MACHINES:
        sample = simulator.generate_sample(machine["id"])
        health_values.append(sample["health_score"])

    avg_health = sum(health_values) / len(health_values) if health_values else 0

    # Simulated business metrics
    estimated_savings = random.uniform(1500, 3500)  # $/day
    downtime_reduction = random.uniform(15, 35)  # %
    tool_life_improvement = random.uniform(20, 45)  # %

    # Simulate alerts count
    alerts_today = random.randint(0, 5)

    return {
        "total_machines": len(MACHINES),
        "active_machines": active_count,
        "idle_machines": idle_count,
        "fault_machines": fault_count,
        "alerts_today": alerts_today,
        "avg_health": round(avg_health, 1),
        "estimated_savings": round(estimated_savings, 2),
        "downtime_reduction": round(downtime_reduction, 1),
        "tool_life_improvement": round(tool_life_improvement, 1)
    }


@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(limit: int = 10, severity: Optional[str] = None) -> List[Dict]:
    """Get recent alerts"""
    simulator = get_simulator()

    alerts = []
    now = datetime.utcnow()

    for i in range(limit):
        # Generate sample and check for anomaly
        sample = simulator.generate_sample(MACHINES[i % len(MACHINES)]["id"])

        if sample["status"] == "fault" or sample["vibration_rms"] > 5:
            severity_level = "critical" if sample["vibration_rms"] > 7 else "high"
            alerts.append({
                "id": i + 1,
                "machine_id": sample["machine_id"],
                "machine_name": sample["machine_name"],
                "timestamp": now - timedelta(minutes=i * 5),
                "alert_type": "anomaly" if sample["status"] == "fault" else "warning",
                "severity": severity_level,
                "title": f"Anomaly detected on {sample['machine_name']}" if sample["status"] == "fault" else f"Elevated vibration on {sample['machine_name']}",
                "message": f"Vibration: {sample['vibration_rms']:.2f} mm/s, Temperature: {sample['temperature']:.1f}°C",
                "acknowledged": False
            })

    # Filter by severity if specified
    if severity:
        alerts = [a for a in alerts if a["severity"] == severity]

    return alerts[:limit]


@router.get("/recommendations", response_model=List[RecommendationResponse])
async def get_recommendations(limit: int = 5) -> List[Dict]:
    """Get recent parameter recommendations"""
    from app.ml.models.optimizer import get_parameter_optimizer

    optimizer = get_parameter_optimizer()
    now = datetime.utcnow()

    recommendations = []
    for i, machine in enumerate(MACHINES[:limit]):
        sample = get_simulator().generate_sample(machine["id"])

        rec_feed, rec_speed, eff_gain, reason = optimizer.optimize(
            current_feed_rate=sample["feed_rate"],
            current_spindle_speed=sample["spindle_speed"],
            tool_health=sample["health_score"]
        )

        recommendations.append({
            "id": i + 1,
            "machine_id": machine["id"],
            "timestamp": now - timedelta(minutes=i * 3),
            "current_feed_rate": sample["feed_rate"],
            "recommended_feed_rate": round(rec_feed, 1),
            "current_spindle_speed": sample["spindle_speed"],
            "recommended_spindle_speed": round(rec_speed, 1),
            "efficiency_gain": round(eff_gain, 1),
            "reason": reason
        })

    return recommendations


@router.get("/health")
async def health_check() -> Dict:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "ml_models": "operational",
            "simulator": "operational",
            "websocket": "operational"
        }
    }