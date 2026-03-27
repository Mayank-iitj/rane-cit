"""
CNC Intelligence Platform - Parameter Optimization API
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import logging

from app.schemas.cnc_schemas import ParameterOptimizationRequest, ParameterOptimizationResponse
from app.ml.models.optimizer import get_parameter_optimizer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/optimize", tags=["optimization"])


@router.post("/parameters", response_model=ParameterOptimizationResponse)
async def optimize_parameters(request: ParameterOptimizationRequest) -> Dict:
    """
    Optimize CNC machining parameters.

    Recommends optimal feed_rate and spindle_speed based on current tool health.
    """
    try:
        optimizer = get_parameter_optimizer()

        recommended_feed, recommended_spindle, efficiency_gain, reason = optimizer.optimize(
            current_feed_rate=request.current_feed_rate,
            current_spindle_speed=request.current_spindle_speed,
            tool_health=request.tool_health
        )

        return ParameterOptimizationResponse(
            recommended_feed_rate=round(recommended_feed, 1),
            recommended_spindle_speed=round(recommended_spindle, 1),
            efficiency_gain=round(efficiency_gain, 1),
            reason=reason
        )

    except Exception as e:
        logger.error(f"Error optimizing parameters: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@router.get("/config")
async def get_optimization_config() -> Dict:
    """Get optimization configuration"""
    optimizer = get_parameter_optimizer()
    return {
        "base_spindle_speed": optimizer.BASE_OPTIMAL["spindle_speed"],
        "base_feed_rate": optimizer.BASE_OPTIMAL["feed_rate"],
        "health_thresholds": optimizer.HEALTH_THRESHOLDS,
        "status": "operational"
    }