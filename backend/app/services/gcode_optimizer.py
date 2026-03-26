"""
G-Code Optimizer Engine
Analyzes and optimizes G-code for better tool life and throughput
"""

import re
import logging
from typing import List, Dict, Tuple
from enum import Enum

logger = logging.getLogger(__name__)


class GCodeOptimization(str, Enum):
    """Types of G-code optimizations"""
    RAPID_TO_FEED = "rapid_to_feed"
    REDUCE_IDLE = "reduce_idle"
    FEED_RATE_ADJUST = "feed_rate_boost"
    SPINDLE_SPEED_ADJUST = "spindle_speed_opt"
    COMBINE_MOVES = "consolidate_moves"


class GCodeAnalyzer:
    """Analyze G-code for optimization opportunities"""

    def __init__(self):
        self.gcode_lines = []
        self.analysis = {}
        self.optimizations = []

    def parse_gcode(self, gcode_text: str) -> List[str]:
        """Parse G-code text into lines"""
        # Remove comments and empty lines
        lines = []
        for line in gcode_text.split("\n"):
            # Remove inline comments
            if ";" in line:
                line = line.split(";")[0]
            line = line.strip()
            if line:
                lines.append(line)
        self.gcode_lines = lines
        return lines

    def analyze(self, gcode_text: str) -> Dict:
        """Analyze G-code for optimization opportunities"""
        self.parse_gcode(gcode_text)

        self.analysis = {
            "total_lines": len(self.gcode_lines),
            "rapid_moves": self._count_rapid_moves(),
            "feed_moves": self._count_feed_moves(),
            "dwell_time": self._calculate_dwell_time(),
            "spindle_commands": self._count_spindle_changes(),
            "idle_time_percentage": self._estimate_idle_time(),
        }

        return self.analysis

    def _count_rapid_moves(self) -> int:
        """Count rapid (G00) movements"""
        return sum(1 for line in self.gcode_lines if "G00" in line or "G0 " in line)

    def _count_feed_moves(self) -> int:
        """Count feed (G01) movements"""
        return sum(1 for line in self.gcode_lines if "G01" in line or "G1 " in line)

    def _calculate_dwell_time(self) -> float:
        """Calculate total dwell time (G04 commands)"""
        total_time = 0.0
        for line in self.gcode_lines:
            if "G04" in line:
                # Extract P or X parameter (dwell time in seconds)
                match = re.search(r"[PX](\d+\.?\d*)", line)
                if match:
                    total_time += float(match.group(1))
        return total_time

    def _count_spindle_changes(self) -> int:
        """Count spindle speed changes (M03, M04, M05)"""
        count = 0
        for line in self.gcode_lines:
            if "M03" in line or "M04" in line or "M05" in line:
                count += 1
        return count

    def _estimate_idle_time(self) -> float:
        """Estimate percentage of time idle or non-cutting"""
        dwell_time = self._calculate_dwell_time()
        rapid_count = self._count_rapid_moves()
        # Estimate: each rapid ~0.5s, each dwell adds to idle
        estimated_idle = dwell_time + (rapid_count * 0.5)
        estimated_total = len(self.gcode_lines) * 0.1  # ~100ms per line
        return (
            (estimated_idle / estimated_total * 100)
            if estimated_total > 0
            else 0.0
        )

    def generate_recommendations(self) -> List[Dict]:
        """Generate optimization recommendations"""
        recommendations = []

        # Recommendation 1: Reduce rapid moves
        if self.analysis["rapid_moves"] > self.analysis["feed_moves"] * 0.3:
            recommendations.append(
                {
                    "optimization": GCodeOptimization.RAPID_TO_FEED,
                    "description": f"High number of rapid moves ({self.analysis['rapid_moves']}). Consider combining rapid and feed moves.",
                    "potential_time_saving": "5-15%",
                    "impact": "medium",
                }
            )

        # Recommendation 2: Reduce idle time
        if self.analysis["idle_time_percentage"] > 20:
            recommendations.append(
                {
                    "optimization": GCodeOptimization.REDUCE_IDLE,
                    "description": f"Idle time is {self.analysis['idle_time_percentage']:.1f}%. Look for opportunities to reduce dwell or tool changes.",
                    "potential_time_saving": "10-20%",
                    "impact": "high",
                }
            )

        # Recommendation 3: Reduce spindle changes
        if self.analysis["spindle_commands"] > 5:
            recommendations.append(
                {
                    "optimization": GCodeOptimization.SPINDLE_SPEED_ADJUST,
                    "description": f"Many spindle changes ({self.analysis['spindle_commands']}). Plan tool sequence to minimize speed changes.",
                    "potential_time_saving": "3-8%",
                    "impact": "medium",
                }
            )

        # Recommendation 4: Increase feed rate
        if self.analysis["dwell_time"] > 0:
            recommendations.append(
                {
                    "optimization": GCodeOptimization.FEED_RATE_ADJUST,
                    "description": "With predictive tool wear monitoring, feed rate can be safely increased 10-15%.",
                    "potential_time_saving": "8-12%",
                    "impact": "high",
                }
            )

        self.optimizations = recommendations
        return recommendations

    def estimate_cycle_time_improvement(self) -> Dict[str, float]:
        """Estimate total cycle time improvement"""
        improvements = {}
        for opt in self.optimizations:
            improvements[opt["optimization"]] = {
                "description": opt["description"],
                "potential_saving": opt["potential_time_saving"],
                "impact": opt["impact"],
            }

        total_potential = 0.05  # Conservative 5% default
        if len(self.optimizations) > 0:
            # Stack improvements conservatively (not multiplicative)
            impacts = {"high": 0.10, "medium": 0.06, "low": 0.03}
            total_potential = sum(impacts.get(opt["impact"], 0.05) for opt in self.optimizations)
            total_potential = min(total_potential, 0.40)  # Cap at 40%

        return {
            "estimated_cycle_time_reduction_percentage": total_potential * 100,
            "estimated_tool_life_extension_percentage": 15.0,  # Conservative estimate
            "recommendations": improvements,
        }


# Example usage and testing
def demo_gcode_optimizer():
    """Demo G-code optimizer"""
    sample_gcode = """
    ; Test part - 2D profile
    G20 G90 G94
    M03 S3000  ; Start spindle
    G00 X1.0 Y1.0 Z0.1
    G01 Z-0.5 F50
    G01 X2.0 F100
    G01 Y2.0 F100
    G01 X1.0 F100
    G01 Y1.0 F100
    G00 Z0.1
    M09  ; Coolant off
    G04 P5  ; Dwell 5 seconds
    M05  ; Stop spindle
    """

    analyzer = GCodeAnalyzer()
    analysis = analyzer.analyze(sample_gcode)
    recommendations = analyzer.generate_recommendations()
    improvements = analyzer.estimate_cycle_time_improvement()

    logger.info(f"G-Code Analysis: {analysis}")
    logger.info(f"Recommendations: {recommendations}")
    logger.info(f"Potential Improvements: {improvements}")

    return {
        "analysis": analysis,
        "recommendations": recommendations,
        "improvements": improvements,
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = demo_gcode_optimizer()
    print(result)
