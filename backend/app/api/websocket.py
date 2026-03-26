"""
CNC Intelligence Platform - WebSocket API for Real-time Streaming
"""

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import logging
import json
from datetime import datetime

from app.services.data_simulator import get_simulator, DemoMode
from app.ml.models.lstm_model import get_lstm_model
from app.ml.models.anomaly import get_anomaly_detector
from app.ml.models.optimizer import get_parameter_optimizer
from app.schemas.cnc_schemas import DemoModeRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/stream", tags=["websocket"])


class ConnectionManager:
    """Manages WebSocket connections"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting: {e}")


# Global connection manager
manager = ConnectionManager()

# Demo mode state
_current_demo_mode = DemoMode.NORMAL
_current_machine_id = None


@router.websocket("/live")
async def websocket_live(websocket: WebSocket):
    """
    WebSocket endpoint for real-time CNC data streaming.

    Streams sensor data, predictions, anomalies, and recommendations.
    """
    await manager.connect(websocket)

    # Get services
    simulator = get_simulator()
    lstm_model = get_lstm_model()
    anomaly_detector = get_anomaly_detector()
    optimizer = get_parameter_optimizer()

    try:
        while True:
            # Generate sample data
            sample = simulator.generate_sample(_current_machine_id or 1)

            # Get predictions
            rul, health, conf = lstm_model.predict_rul(
                spindle_speed=sample["spindle_speed"],
                feed_rate=sample["feed_rate"],
                vibration=sample["vibration_rms"],
                temperature=sample["temperature"],
                acoustic_emission=sample["acoustic_emission"]
            )

            # Detect anomalies
            anomaly_flag, anomaly_score, severity, anomaly_type = anomaly_detector.detect_anomaly(
                vibration_x=sample["vibration_x"],
                vibration_y=sample["vibration_y"],
                vibration_z=sample["vibration_z"],
                temperature=sample["temperature"],
                acoustic_emission=sample["acoustic_emission"]
            )

            # Optimize parameters
            rec_feed, rec_speed, eff_gain, reason = optimizer.optimize(
                current_feed_rate=sample["feed_rate"],
                current_spindle_speed=sample["spindle_speed"],
                tool_health=health
            )

            # Build response
            live_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "machine_id": sample["machine_id"],
                "machine_name": sample["machine_name"],
                "status": sample["status"],
                "tool_id": sample["tool_id"],
                "sensors": {
                    "spindle_speed": sample["spindle_speed"],
                    "feed_rate": sample["feed_rate"],
                    "vibration_x": sample["vibration_x"],
                    "vibration_y": sample["vibration_y"],
                    "vibration_z": sample["vibration_z"],
                    "vibration_rms": sample["vibration_rms"],
                    "temperature": sample["temperature"],
                    "acoustic_emission": sample["acoustic_emission"],
                    "power_consumption": sample["power_consumption"]
                },
                "predictions": {
                    "rul_minutes": round(rul, 1),
                    "health_score": round(health, 1),
                    "confidence": round(conf, 2)
                },
                "anomaly": {
                    "flag": anomaly_flag,
                    "score": round(anomaly_score, 3),
                    "severity": severity,
                    "type": anomaly_type
                },
                "optimization": {
                    "recommended_feed_rate": round(rec_feed, 1),
                    "recommended_spindle_speed": round(rec_speed, 1),
                    "efficiency_gain": round(eff_gain, 1)
                }
            }

            # Send data
            await websocket.send_json(live_data)

            # Wait before next sample (1-2 seconds)
            await asyncio.sleep(1.5)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@router.post("/demo-mode")
async def set_demo_mode(request: DemoModeRequest):
    """Set demo mode for simulation"""
    global _current_demo_mode, _current_machine_id

    simulator = get_simulator()
    simulator.set_mode(request.mode, request.machine_id)

    _current_demo_mode = request.mode
    _current_machine_id = request.machine_id

    return {
        "mode": request.mode,
        "machine_id": request.machine_id,
        "status": "updated"
    }


@router.get("/demo-mode")
async def get_demo_mode():
    """Get current demo mode"""
    return {
        "mode": _current_demo_mode,
        "machine_id": _current_machine_id
    }