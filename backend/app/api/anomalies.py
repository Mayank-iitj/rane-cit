"""
CNC Intelligence Platform - Anomaly Detection API
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import logging

from app.schemas.cnc_schemas import AnomalyDetectionRequest, AnomalyDetectionResponse
from app.ml.models.anomaly import get_anomaly_detector

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/detect", tags=["anomaly"])


@router.post("/anomaly", response_model=AnomalyDetectionResponse)
async def detect_anomaly(request: AnomalyDetectionRequest) -> Dict:
    """
    Detect anomalies in CNC machining operations.

    Uses Isolation Forest for anomaly detection with rule-based fallback.
    """
    try:
        detector = get_anomaly_detector()

        anomaly_flag, anomaly_score, severity, anomaly_type = detector.detect_anomaly(
            vibration_x=request.vibration_x,
            vibration_y=request.vibration_y,
            vibration_z=request.vibration_z,
            temperature=request.temperature,
            acoustic_emission=request.acoustic_emission
        )

        return AnomalyDetectionResponse(
            anomaly_flag=anomaly_flag,
            anomaly_score=round(anomaly_score, 3),
            severity=severity,
            anomaly_type=anomaly_type
        )

    except Exception as e:
        logger.error(f"Error detecting anomaly: {e}")
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")


@router.get("/status")
async def get_anomaly_status() -> Dict:
    """Get anomaly detection status"""
    detector = get_anomaly_detector()
    return {
        "model": "isolation_forest" if detector.model else "rule-based",
        "threshold": detector.threshold,
        "status": "operational"
    }