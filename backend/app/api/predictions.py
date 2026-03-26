"""
CNC Intelligence Platform - Tool Health Prediction API
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import logging

from app.schemas.cnc_schemas import ToolHealthRequest, ToolHealthResponse
from app.ml.models.lstm_model import get_lstm_model
from app.ml.models.xgb_model import get_xgb_model

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/predict", tags=["predictions"])


@router.post("/tool-health", response_model=ToolHealthResponse)
async def predict_tool_health(request: ToolHealthRequest) -> Dict:
    """
    Predict tool health and Remaining Useful Life (RUL).

    Uses LSTM model for primary prediction, XGBoost as baseline.
    """
    try:
        # Get models
        lstm_model = get_lstm_model()
        xgb_model = get_xgb_model()

        # Get predictions from both models
        lstm_rul, lstm_health, lstm_conf = lstm_model.predict_rul(
            spindle_speed=request.spindle_speed,
            feed_rate=request.feed_rate,
            vibration=request.vibration,
            temperature=request.temperature,
            acoustic_emission=request.acoustic_emission
        )

        xgb_rul, xgb_health, xgb_conf = xgb_model.predict_rul(
            spindle_speed=request.spindle_speed,
            feed_rate=request.feed_rate,
            vibration=request.vibration,
            temperature=request.temperature,
            acoustic_emission=request.acoustic_emission
        )

        # Ensemble: average predictions weighted by confidence
        total_conf = lstm_conf + xgb_conf
        weighted_rul = (lstm_rul * lstm_conf + xgb_rul * xgb_conf) / total_conf
        weighted_health = (lstm_health * lstm_conf + xgb_health * xgb_conf) / total_conf
        avg_conf = total_conf / 2

        return ToolHealthResponse(
            rul_minutes=round(weighted_rul, 1),
            health_score=round(weighted_health, 1),
            confidence=round(avg_conf, 2),
            model_used="ensemble"
        )

    except Exception as e:
        logger.error(f"Error predicting tool health: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/models/status")
async def get_model_status() -> Dict:
    """Get status of ML models"""
    return {
        "lstm_model": "loaded" if get_lstm_model().model else "fallback",
        "xgb_model": "loaded" if get_xgb_model().model else "fallback",
        "prediction_mode": "physics-based"
    }