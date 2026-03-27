"""
cnc-mayyanks-ingestion — Data Pipeline Service
Kafka-based telemetry ingestion from edge agents and simulators
Service: cnc-mayyanks-ingestion | Port: 8003
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import json
import logging
import random
import math
from datetime import datetime, timezone

logging.basicConfig(level="INFO", format="%(asctime)s [cnc-mayyanks-ingestion] %(levelname)s %(message)s")
logger = logging.getLogger("cnc-mayyanks-ingestion")

app = FastAPI(
    title="cnc-mayyanks-ingestion",
    description="CNC Mayyanks Telemetry Ingestion Service (cnc.mayyanks.app)",
    version="1.0.0",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ═══════════════════════════════════════════════════
# Kafka Topics
# ═══════════════════════════════════════════════════

TOPICS = {
    "raw": "cnc.telemetry.raw",
    "processed": "cnc.telemetry.processed",
    "alerts": "cnc.alerts",
}

# In-memory buffer (production would use Kafka)
message_buffer = {"raw": [], "processed": [], "alerts": []}
stats = {"total_ingested": 0, "total_processed": 0, "total_alerts_generated": 0, "start_time": None}


# ═══════════════════════════════════════════════════
# CNC Simulator
# ═══════════════════════════════════════════════════

class CNCSimulator:
    """Generates realistic CNC machine telemetry data"""

    def __init__(self, machine_id: str, name: str):
        self.machine_id = machine_id
        self.name = name
        self.spindle_speed = random.uniform(2500, 5000)
        self.temperature = random.uniform(30, 40)
        self.vibration = random.uniform(0.5, 2.0)
        self.load = random.uniform(40, 70)
        self.tool_wear = random.uniform(5, 25)
        self.tick = 0
        self.state = "running"
        self.coolant_flow = random.uniform(12, 22)
        self.power = random.uniform(1000, 3000)

    def generate(self) -> dict:
        self.tick += 1
        t = self.tick * 0.1

        # Simulate realistic machining dynamics
        # Spindle speed varies with cutting load
        self.spindle_speed += random.gauss(0, 30)
        self.spindle_speed = max(500, min(8000, self.spindle_speed))

        # Temperature rises gradually with operation
        self.temperature += 0.02 + random.gauss(0, 0.3)
        if self.temperature > 65:
            self.temperature -= 5  # Coolant kicks in
        self.temperature = max(20, min(90, self.temperature))

        # Vibration with occasional spikes
        self.vibration += random.gauss(0, 0.1)
        if random.random() < 0.02:
            self.vibration += random.uniform(1, 3)  # Spike
        self.vibration = max(0.1, min(12, self.vibration))
        self.vibration *= 0.98  # Decay

        # Load varies with cutting conditions
        self.load += random.gauss(0, 2)
        self.load = max(10, min(100, self.load))

        # Tool wear increases monotonically
        self.tool_wear += random.uniform(0.01, 0.05)
        self.tool_wear = min(100, self.tool_wear)

        # Power consumption correlates with load
        self.power = 500 + self.load * 30 + random.gauss(0, 100)

        # Coolant
        self.coolant_flow += random.gauss(0, 0.5)
        self.coolant_flow = max(5, min(30, self.coolant_flow))

        return {
            "machine_id": self.machine_id,
            "machine_name": self.name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "spindle_speed": round(self.spindle_speed, 1),
            "feed_rate": round(300 + self.load * 5 + random.gauss(0, 20), 1),
            "temperature": round(self.temperature, 2),
            "vibration": round(self.vibration, 3),
            "load_percent": round(self.load, 1),
            "power_consumption": round(max(0, self.power), 1),
            "tool_id": f"T{(self.tick // 100 % 8) + 1:02d}",
            "tool_wear": round(self.tool_wear, 2),
            "coolant_flow": round(self.coolant_flow, 1),
            "coolant_temp": round(22 + random.gauss(0, 2), 1),
            "axis_positions": {
                "x": round(150 * math.sin(t * 0.3) + random.gauss(0, 5), 2),
                "y": round(100 * math.cos(t * 0.2) + random.gauss(0, 5), 2),
                "z": round(-50 + 20 * math.sin(t * 0.1) + random.gauss(0, 2), 2),
            },
        }


# Initialize simulators
simulators = [
    CNCSimulator("sim-001", "Haas VF-2SS"),
    CNCSimulator("sim-002", "DMG MORI DMU 50"),
    CNCSimulator("sim-003", "Mazak QTN 200"),
    CNCSimulator("sim-004", "Fanuc RoboDrill"),
]


# ═══════════════════════════════════════════════════
# Processing Pipeline
# ═══════════════════════════════════════════════════

def process_telemetry(raw: dict) -> dict:
    """Process raw telemetry — threshold checking, anomaly flags"""
    processed = dict(raw)
    processed["processed_at"] = datetime.now(timezone.utc).isoformat()

    alerts = []

    # Threshold checks
    if raw.get("temperature", 0) > 70:
        alerts.append({
            "type": "threshold",
            "severity": "critical",
            "title": f"Temperature {raw['temperature']}°C exceeds 70°C limit",
            "machine_id": raw["machine_id"],
        })

    if raw.get("vibration", 0) > 5.0:
        alerts.append({
            "type": "anomaly",
            "severity": "warning",
            "title": f"Vibration {raw['vibration']} mm/s above normal range",
            "machine_id": raw["machine_id"],
        })

    if raw.get("tool_wear", 0) > 85:
        alerts.append({
            "type": "maintenance",
            "severity": "warning",
            "title": f"Tool wear at {raw['tool_wear']}% — replacement recommended",
            "machine_id": raw["machine_id"],
        })

    if raw.get("load_percent", 0) > 95:
        alerts.append({
            "type": "threshold",
            "severity": "critical",
            "title": f"Machine load at {raw['load_percent']}% — risk of overload",
            "machine_id": raw["machine_id"],
        })

    processed["alerts_generated"] = len(alerts)
    return processed, alerts


_running = False

async def ingestion_loop():
    """Main ingestion loop — simulates Kafka consumer/producer"""
    global _running
    _running = True
    stats["start_time"] = datetime.now(timezone.utc).isoformat()
    logger.info(f"Ingestion pipeline started — {len(simulators)} simulators active")

    while _running:
        for sim in simulators:
            raw = sim.generate()
            message_buffer["raw"].append(raw)
            stats["total_ingested"] += 1

            # Process
            processed, alerts = process_telemetry(raw)
            message_buffer["processed"].append(processed)
            stats["total_processed"] += 1

            # Emit alerts
            for alert in alerts:
                message_buffer["alerts"].append(alert)
                stats["total_alerts_generated"] += 1

            # Keep buffer manageable
            for key in message_buffer:
                if len(message_buffer[key]) > 1000:
                    message_buffer[key] = message_buffer[key][-500:]

        await asyncio.sleep(1)


@app.on_event("startup")
async def startup():
    asyncio.create_task(ingestion_loop())


@app.on_event("shutdown")
async def shutdown():
    global _running
    _running = False


# ═══════════════════════════════════════════════════
# API Endpoints
# ═══════════════════════════════════════════════════

class IngestRequest(BaseModel):
    machine_id: str
    data: dict

@app.post("/ingest")
async def ingest(body: IngestRequest):
    """Manually ingest telemetry data"""
    body.data["machine_id"] = body.machine_id
    body.data["timestamp"] = body.data.get("timestamp", datetime.now(timezone.utc).isoformat())
    message_buffer["raw"].append(body.data)
    processed, alerts = process_telemetry(body.data)
    message_buffer["processed"].append(processed)
    for a in alerts:
        message_buffer["alerts"].append(a)
    stats["total_ingested"] += 1
    stats["total_processed"] += 1
    stats["total_alerts_generated"] += len(alerts)
    return {"status": "ingested", "alerts_generated": len(alerts)}


@app.get("/stats")
async def get_stats():
    """Get ingestion pipeline statistics"""
    return {
        "service": "cnc-mayyanks-ingestion",
        **stats,
        "buffer_sizes": {k: len(v) for k, v in message_buffer.items()},
        "topics": TOPICS,
        "simulators_active": len(simulators),
    }


@app.get("/latest/{topic}")
async def get_latest(topic: str, count: int = 10):
    """Get latest messages from a topic buffer"""
    if topic not in message_buffer:
        return {"error": "Unknown topic", "available": list(message_buffer.keys())}
    return {"topic": topic, "messages": message_buffer[topic][-count:]}


@app.get("/")
async def root():
    return {
        "service": "cnc-mayyanks-ingestion",
        "product": "cnc.mayyanks.app",
        "topics": TOPICS,
        "simulators": len(simulators),
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "cnc-mayyanks-ingestion", "ingested": stats["total_ingested"]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)
