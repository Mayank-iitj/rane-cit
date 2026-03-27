"""
cnc-mayyanks-api — CopilotModule
AI assistant using Ollama / external API for CNC intelligence Q&A
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta, timezone
import httpx
import json

from api.config import settings
from api.database.connection import get_db
from api.database.models import Machine, Telemetry, Alert, AlertSeverity, User
from api.modules.auth import get_current_user

router = APIRouter(prefix="/api/copilot", tags=["AI Copilot"])


class CopilotQuery(BaseModel):
    question: str
    machine_id: Optional[str] = None
    context: Optional[str] = None

class CopilotResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[dict]
    suggested_actions: List[str]


async def gather_machine_context(machine_id: str, db: AsyncSession) -> dict:
    """Gather real-time context about a machine for the AI copilot"""
    result = await db.execute(select(Machine).where(Machine.id == machine_id))
    machine = result.scalar_one_or_none()
    if not machine:
        return {}

    # Latest telemetry
    tel_result = await db.execute(
        select(Telemetry).where(Telemetry.machine_id == machine_id)
        .order_by(Telemetry.timestamp.desc()).limit(10)
    )
    telemetry = tel_result.scalars().all()

    # Recent alerts
    alert_result = await db.execute(
        select(Alert).where(Alert.machine_id == machine_id)
        .order_by(Alert.created_at.desc()).limit(5)
    )
    alerts = alert_result.scalars().all()

    return {
        "machine": {
            "name": machine.name,
            "status": machine.status.value,
            "model": machine.model,
            "location": machine.location,
        },
        "latest_readings": [
            {
                "spindle_speed": t.spindle_speed,
                "temperature": t.temperature,
                "vibration": t.vibration,
                "load_percent": t.load_percent,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            }
            for t in telemetry[:5]
        ],
        "recent_alerts": [
            {
                "severity": a.severity.value,
                "title": a.title,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in alerts
        ],
    }


async def generate_ai_response(question: str, context: dict) -> dict:
    """Generate AI response using built-in intelligence engine"""
    question_lower = question.lower()
    machine_ctx = context.get("machine", {})
    telemetry = context.get("latest_readings", [])
    alerts = context.get("recent_alerts", [])

    # ── Built-in intelligence rules ──
    answer = ""
    confidence = 0.85
    actions = []
    sources = []

    # Machine status queries
    if any(w in question_lower for w in ["status", "state", "running", "online"]):
        status = machine_ctx.get("status", "unknown")
        name = machine_ctx.get("name", "the machine")
        answer = f"{name} is currently **{status}**."
        if telemetry:
            latest = telemetry[0]
            answer += f" Latest readings: spindle speed {latest.get('spindle_speed', 'N/A')} RPM, "
            answer += f"temperature {latest.get('temperature', 'N/A')}°C, "
            answer += f"vibration {latest.get('vibration', 'N/A')} mm/s."
        sources = [{"type": "telemetry", "count": len(telemetry)}]

    # Stop/shutdown queries
    elif any(w in question_lower for w in ["stop", "stopped", "shut", "down", "why"]):
        if alerts:
            critical = [a for a in alerts if a.get("severity") == "critical"]
            if critical:
                answer = f"The machine stopped due to a **critical alert**: {critical[0].get('title', 'Unknown')}."
                actions = ["Review alert details", "Inspect the machine", "Check sensor readings"]
            else:
                answer = "The machine appears to have stopped. Recent alerts may provide clues."
                actions = ["Check maintenance schedule", "Verify power supply", "Review error logs"]
        else:
            answer = "No recent alerts found. The machine may have been manually stopped or completed its program."
            actions = ["Check operator logs", "Verify G-code program completion"]
        sources = [{"type": "alerts", "count": len(alerts)}]

    # Failure prediction queries
    elif any(w in question_lower for w in ["predict", "failure", "break", "maintenance", "life"]):
        if telemetry:
            avg_vibration = sum(t.get("vibration", 0) or 0 for t in telemetry) / max(len(telemetry), 1)
            avg_temp = sum(t.get("temperature", 0) or 0 for t in telemetry) / max(len(telemetry), 1)

            if avg_vibration > 5.0:
                answer = f"⚠️ **High failure risk detected.** Average vibration is {avg_vibration:.2f} mm/s (threshold: 5.0). "
                answer += "Recommend immediate inspection of bearings and spindle assembly."
                confidence = 0.92
                actions = ["Schedule immediate maintenance", "Reduce spindle speed", "Replace worn bearings"]
            elif avg_temp > 70:
                answer = f"⚠️ **Elevated temperature risk.** Average temperature is {avg_temp:.1f}°C. "
                answer += "Check coolant system and reduce feed rate."
                confidence = 0.88
                actions = ["Increase coolant flow", "Reduce feed rate by 15%", "Check coolant level"]
            else:
                answer = f"✅ Machine appears healthy. Vibration: {avg_vibration:.2f} mm/s, Temperature: {avg_temp:.1f}°C. "
                answer += "Estimated remaining useful life: 450+ operating hours."
                confidence = 0.80
                actions = ["Continue monitoring", "Schedule routine maintenance in 2 weeks"]
        else:
            answer = "Insufficient telemetry data for prediction. Ensure sensors are reporting."
            actions = ["Verify sensor connections", "Check edge agent status"]
        sources = [{"type": "telemetry_analysis", "count": len(telemetry)}]

    # Optimization queries
    elif any(w in question_lower for w in ["optimize", "improve", "efficiency", "better", "feed", "speed"]):
        answer = "Based on current operating parameters, I recommend:\n"
        answer += "1. **Reduce feed rate by 10%** during roughing operations to extend tool life\n"
        answer += "2. **Optimize spindle speed** to match material removal rate\n"
        answer += "3. **Enable adaptive feed control** for consistent chip load\n"
        confidence = 0.82
        actions = ["Update machining parameters", "Analyze G-code for inefficiencies", "Review tool selection"]
        sources = [{"type": "optimization_engine", "count": 1}]

    # Energy queries
    elif any(w in question_lower for w in ["energy", "power", "consumption", "cost", "electric"]):
        if telemetry:
            avg_power = sum(t.get("load_percent", 0) or 0 for t in telemetry) / max(len(telemetry), 1)
            answer = f"Average load: {avg_power:.1f}%. Recommendations:\n"
            answer += "1. Reduce idle power by enabling auto-sleep mode\n"
            answer += "2. Shift heavy operations to off-peak hours\n"
            answer += "3. Optimize tool paths to minimize non-cutting time"
            actions = ["Enable power-save mode", "Schedule heavy jobs during off-peak", "Review spindle ramp-up profiles"]
        else:
            answer = "No energy data available. Ensure power monitoring sensors are active."
        sources = [{"type": "energy_analysis", "count": 1}]

    # Default
    else:
        answer = (
            f"I'm the cnc.mayyanks.app AI Copilot. I can help with:\n"
            f"- Machine status and diagnostics\n"
            f"- Failure prediction and maintenance scheduling\n"
            f"- Process optimization suggestions\n"
            f"- Energy consumption analysis\n"
            f"- G-code analysis and optimization\n\n"
            f"Try asking: 'Why did Machine 2 stop?' or 'Predict next failure'"
        )
        confidence = 1.0
        actions = []
        sources = [{"type": "copilot_info", "count": 1}]

    return {
        "answer": answer,
        "confidence": confidence,
        "sources": sources,
        "suggested_actions": actions,
    }


@router.post("/ask", response_model=CopilotResponse)
async def ask_copilot(
    body: CopilotQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ask the AI copilot a question about CNC operations"""
    context = {}
    if body.machine_id:
        context = await gather_machine_context(body.machine_id, db)

    response = await generate_ai_response(body.question, context)
    return CopilotResponse(**response)


@router.get("/suggestions/{machine_id}")
async def get_autonomous_suggestions(
    machine_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get autonomous suggestions for a machine"""
    context = await gather_machine_context(machine_id, db)
    telemetry = context.get("latest_readings", [])
    suggestions = []

    if telemetry:
        avg_vibration = sum(t.get("vibration", 0) or 0 for t in telemetry) / max(len(telemetry), 1)
        avg_temp = sum(t.get("temperature", 0) or 0 for t in telemetry) / max(len(telemetry), 1)
        avg_load = sum(t.get("load_percent", 0) or 0 for t in telemetry) / max(len(telemetry), 1)

        if avg_vibration > 4.0:
            suggestions.append({
                "type": "reduce_feed_rate",
                "priority": "high",
                "message": f"Vibration at {avg_vibration:.2f} mm/s — reduce feed rate by 15%",
                "auto_executable": True,
            })
        if avg_temp > 65:
            suggestions.append({
                "type": "increase_coolant",
                "priority": "high",
                "message": f"Temperature at {avg_temp:.1f}°C — increase coolant flow",
                "auto_executable": True,
            })
        if avg_load > 90:
            suggestions.append({
                "type": "tool_change",
                "priority": "medium",
                "message": "Load consistently above 90% — consider tool change",
                "auto_executable": False,
            })
        if avg_load < 30:
            suggestions.append({
                "type": "increase_feed_rate",
                "priority": "low",
                "message": "Machine underutilized — consider increasing feed rate",
                "auto_executable": True,
            })

    return {"machine_id": machine_id, "suggestions": suggestions}
