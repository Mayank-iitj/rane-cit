"""
CNC Intelligence Platform - Parameter Optimization Engine
Recommends optimal feed rate and spindle speed based on tool health and conditions
"""

import numpy as np
from typing import Tuple
import logging

logger = logging.getLogger(__name__)


class ParameterOptimizer:
    """
    Optimization engine for CNC machining parameters.
    Recommends feed_rate and spindle_speed to maximize efficiency while maintaining tool life.
    """

    # Optimal parameter ranges for different tool health levels
    HEALTH_THRESHOLDS = {
        "excellent": 80,  # Tool health >= 80%
        "good": 60,       # 60% <= health < 80%
        "fair": 40,       # 40% <= health < 60%
        "poor": 0         # health < 40%
    }

    # Base optimal parameters (for excellent tool health)
    BASE_OPTIMAL = {
        "spindle_speed": 6500,  # RPM
        "feed_rate": 450        # mm/min
    }

    def __init__(self):
        self.model = None

    def optimize(self, current_feed_rate: float, current_spindle_speed: float,
                 tool_health: float) -> Tuple[float, float, float, str]:
        """
        Optimize machining parameters.

        Args:
            current_feed_rate: Current feed rate (mm/min)
            current_spindle_speed: Current spindle speed (RPM)
            tool_health: Current tool health score (0-100)

        Returns:
            recommended_feed_rate: Optimized feed rate
            recommended_spindle_speed: Optimized spindle speed
            efficiency_gain: Expected efficiency improvement (%)
            reason: Explanation for recommendations
        """
        # Determine health category
        if tool_health >= self.HEALTH_THRESHOLDS["excellent"]:
            category = "excellent"
            speed_factor = 1.0
            feed_factor = 1.0
        elif tool_health >= self.HEALTH_THRESHOLDS["good"]:
            category = "good"
            speed_factor = 0.90
            feed_factor = 0.85
        elif tool_health >= self.HEALTH_THRESHOLDS["fair"]:
            category = "fair"
            speed_factor = 0.75
            feed_factor = 0.70
        else:
            category = "poor"
            speed_factor = 0.60
            feed_factor = 0.50

        # Calculate recommendations
        recommended_spindle = self.BASE_OPTIMAL["spindle_speed"] * speed_factor
        recommended_feed = self.BASE_OPTIMAL["feed_rate"] * feed_factor

        # Ensure within safe bounds
        recommended_spindle = max(3000, min(10000, recommended_spindle))
        recommended_feed = max(100, min(600, recommended_feed))

        # Calculate efficiency gain
        efficiency_gain = self._calculate_efficiency_gain(
            current_feed_rate, current_spindle_speed,
            recommended_feed, recommended_spindle,
            tool_health
        )

        # Generate reason
        reason = self._generate_reason(category, tool_health, efficiency_gain)

        return recommended_feed, recommended_spindle, efficiency_gain, reason

    def _calculate_efficiency_gain(self, current_feed: float, current_spindle: float,
                                   recommended_feed: float, recommended_spindle: float,
                                   tool_health: float) -> float:
        """Calculate expected efficiency improvement"""
        # Base MRR (Material Removal Rate) = feed * depth * width (simplified)
        # Assume constant depth and width for comparison
        current_mrr = current_feed / current_spindle if current_spindle > 0 else 0
        recommended_mrr = recommended_feed / recommended_spindle if recommended_spindle > 0 else 0

        # Efficiency also considers tool life preservation
        if tool_health < 50:
            # Prioritize tool life, may reduce efficiency
            efficiency = (recommended_mrr / current_mrr - 1) * 100 * 0.3
        else:
            efficiency = (recommended_mrr / current_mrr - 1) * 100

        # Clamp to reasonable range
        return max(-20, min(40, efficiency))

    def _generate_reason(self, category: str, tool_health: float, efficiency: float) -> str:
        """Generate human-readable explanation"""
        reasons = {
            "excellent": f"Tool at {tool_health:.0f}% health - optimal parameters recommended for maximum throughput",
            "good": f"Tool at {tool_health:.0f}% health - moderate parameters to extend tool life while maintaining productivity",
            "fair": f"Tool at {tool_health:.0f}% health - reduced parameters to prevent premature tool failure",
            "poor": f"Tool at {tool_health:.0f}% health - conservative parameters to prevent breakage, recommend tool change"
        }

        base = reasons.get(category, "Custom parameters")

        if efficiency > 5:
            base += f" | Expected efficiency gain: +{efficiency:.1f}%"
        elif efficiency < -5:
            base += f" | Note: Parameters reduced by {abs(efficiency):.1f}% for safety"

        return base


def get_parameter_optimizer() -> ParameterOptimizer:
    """Get singleton optimizer instance"""
    if not hasattr(get_parameter_optimizer, '_instance'):
        get_parameter_optimizer._instance = ParameterOptimizer()
    return get_parameter_optimizer._instance