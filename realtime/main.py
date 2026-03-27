"""
cnc-mayyanks-realtime — WebSocket Server
Emits: machine:update, telemetry:new, alert:triggered
Service: cnc-mayyanks-realtime | Port: 8002
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import logging
import random
from datetime import datetime, timezone
from typing import Dict, Set

logging.basicConfig(level="INFO", format="%(asctime)s [cnc-mayyanks-realtime] %(levelname)s %(message)s")
logger = logging.getLogger("cnc-mayyanks-realtime")

app = FastAPI(
    title="cnc-mayyanks-realtime",
    description="CNC Mayyanks Real-time WebSocket Service (cnc.mayyanks.app)",
    version="1.0.0",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ═══════════════════════════════════════════════════
# Connection Manager
# ═══════════════════════════════════════════════════

class ConnectionManager:
    """Manages WebSocket connections with channel subscriptions"""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, Set[str]] = {}  # channel -> set of client_ids
        self._counter = 0

    async def connect(self, websocket: WebSocket, client_id: str = None) -> str:
        await websocket.accept()
        if not client_id:
            self._counter += 1
            client_id = f"client_{self._counter}"
        self.active_connections[client_id] = websocket
        logger.info(f"Client connected: {client_id} (total: {len(self.active_connections)})")
        return client_id

    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)
        for channel in self.subscriptions:
            self.subscriptions[channel].discard(client_id)
        logger.info(f"Client disconnected: {client_id} (remaining: {len(self.active_connections)})")

    def subscribe(self, client_id: str, channel: str):
        if channel not in self.subscriptions:
            self.subscriptions[channel] = set()
        self.subscriptions[channel].add(client_id)

    def unsubscribe(self, client_id: str, channel: str):
        if channel in self.subscriptions:
            self.subscriptions[channel].discard(client_id)

    async def broadcast(self, channel: str, data: dict):
        """Broadcast to all subscribers of a channel"""
        subscribers = self.subscriptions.get(channel, set())
        message = json.dumps({"channel": channel, "data": data, "timestamp": datetime.now(timezone.utc).isoformat()})
        disconnected = []
        for client_id in subscribers:
            ws = self.active_connections.get(client_id)
            if ws:
                try:
                    await ws.send_text(message)
                except Exception:
                    disconnected.append(client_id)
        for cid in disconnected:
            self.disconnect(cid)

    async def broadcast_all(self, data: dict):
        """Broadcast to ALL connected clients"""
        message = json.dumps(data)
        disconnected = []
        for client_id, ws in self.active_connections.items():
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(client_id)
        for cid in disconnected:
            self.disconnect(cid)


manager = ConnectionManager()


# ═══════════════════════════════════════════════════
# WebSocket Endpoint
# ═══════════════════════════════════════════════════

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    """Main WebSocket endpoint for real-time CNC data"""
    client_id = await manager.connect(websocket)

    # Auto-subscribe to default channels
    for ch in ["machine:update", "telemetry:new", "alert:triggered"]:
        manager.subscribe(client_id, ch)

    # Send welcome
    await websocket.send_text(json.dumps({
        "type": "connected",
        "client_id": client_id,
        "channels": ["machine:update", "telemetry:new", "alert:triggered"],
        "service": "cnc-mayyanks-realtime",
    }))

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get("type") == "subscribe":
                manager.subscribe(client_id, msg["channel"])
                await websocket.send_text(json.dumps({"type": "subscribed", "channel": msg["channel"]}))

            elif msg.get("type") == "unsubscribe":
                manager.unsubscribe(client_id, msg["channel"])
                await websocket.send_text(json.dumps({"type": "unsubscribed", "channel": msg["channel"]}))

            elif msg.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(client_id)


# ═══════════════════════════════════════════════════
# Internal publish endpoint (called by API/Ingestion)
# ═══════════════════════════════════════════════════

from pydantic import BaseModel

class PublishRequest(BaseModel):
    channel: str
    data: dict

@app.post("/publish")
async def publish_event(body: PublishRequest):
    """Publish an event to WebSocket subscribers (internal API)"""
    await manager.broadcast(body.channel, body.data)
    subscriber_count = len(manager.subscriptions.get(body.channel, set()))
    return {"status": "published", "channel": body.channel, "subscribers": subscriber_count}


# ═══════════════════════════════════════════════════
# CNC Simulator (built-in for demos)
# ═══════════════════════════════════════════════════

_simulator_running = False

async def run_simulator():
    """Generate simulated CNC telemetry and broadcast via WebSocket"""
    global _simulator_running
    _simulator_running = True
    logger.info("CNC Simulator started — broadcasting live telemetry")

    machines = [
        {"id": "sim-001", "name": "Haas VF-2SS", "base_spindle": 3500, "base_temp": 35},
        {"id": "sim-002", "name": "DMG MORI DMU 50", "base_spindle": 4200, "base_temp": 38},
        {"id": "sim-003", "name": "Mazak QTN 200", "base_spindle": 2800, "base_temp": 33},
        {"id": "sim-004", "name": "Fanuc RoboDrill", "base_spindle": 5000, "base_temp": 32},
    ]

    tick = 0
    while _simulator_running:
        for machine in machines:
            tick += 1
            t = tick * 0.1

            telemetry = {
                "machine_id": machine["id"],
                "machine_name": machine["name"],
                "spindle_speed": round(machine["base_spindle"] + 200 * random.gauss(0, 1) + 100 * abs(random.gauss(0, 1)) * (1 if random.random() > 0.95 else 0), 1),
                "temperature": round(machine["base_temp"] + 5 * abs(random.gauss(0, 1)) + 0.01 * tick, 1),
                "vibration": round(1.5 + 0.5 * random.gauss(0, 1), 3),
                "load_percent": round(60 + 15 * random.gauss(0, 1), 1),
                "feed_rate": round(400 + 100 * random.gauss(0, 1), 1),
                "power_consumption": round(1500 + 500 * random.gauss(0, 1), 1),
                "tool_id": f"T{random.randint(1, 8):02d}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            await manager.broadcast("telemetry:new", telemetry)

            # Machine status updates (less frequent)
            if tick % 10 == 0:
                status = random.choice(["running", "running", "running", "idle"])
                await manager.broadcast("machine:update", {
                    "machine_id": machine["id"],
                    "status": status,
                    "name": machine["name"],
                })

            # Random alerts (rare)
            if random.random() < 0.005:
                await manager.broadcast("alert:triggered", {
                    "machine_id": machine["id"],
                    "machine_name": machine["name"],
                    "severity": random.choice(["warning", "critical"]),
                    "title": random.choice([
                        "Vibration anomaly detected",
                        "Temperature exceeding threshold",
                        "Tool wear approaching limit",
                        "Spindle load spike detected",
                    ]),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

        await asyncio.sleep(1)


@app.on_event("startup")
async def startup():
    asyncio.create_task(run_simulator())


@app.on_event("shutdown")
async def shutdown():
    global _simulator_running
    _simulator_running = False


@app.get("/")
async def root():
    return {
        "service": "cnc-mayyanks-realtime",
        "product": "cnc.mayyanks.app",
        "connections": len(manager.active_connections),
        "channels": list(manager.subscriptions.keys()),
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "cnc-mayyanks-realtime", "connections": len(manager.active_connections)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
