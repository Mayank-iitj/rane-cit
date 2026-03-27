"""
ROI Analytics Module
Calculate and display return on investment metrics
"""

import logging
from typing import Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ROICalculator:
    """Calculate ROI metrics for CNC intelligence platform"""

    # Cost factors (adjust based on facility)
    TOOL_COST_PER_UNIT = 150  # dollars
    DOWNTIME_COST_PER_HOUR = 500  # dollars (machine + operator)
    SCRAP_COST_PER_PART = 25  # dollars

    # Baseline metrics (without platform)
    BASELINE_TOOL_BREAKAGE_PER_WEEK = 2.5
    BASELINE_UNPLANNED_DOWNTIME_HOURS_PER_WEEK = 5.0
    BASELINE_SCRAP_RATE = 2.5  # percentage

    # Expected improvements
    TOOL_BREAKAGE_REDUCTION = 0.70  # 70% reduction
    DOWNTIME_REDUCTION = 0.75  # 75% reduction
    SCRAP_REDUCTION = 0.55  # 55% reduction

    @classmethod
    def calculate_weekly_savings(cls) -> Dict[str, float]:
        """Calculate estimated weekly savings"""
        return {
            "tool_savings": cls.BASELINE_TOOL_BREAKAGE_PER_WEEK
            * cls.TOOL_BREAKAGE_REDUCTION
            * cls.TOOL_COST_PER_UNIT,
            "downtime_savings": cls.BASELINE_UNPLANNED_DOWNTIME_HOURS_PER_WEEK
            * cls.DOWNTIME_REDUCTION
            * cls.DOWNTIME_COST_PER_HOUR,
            "scrap_savings_estimated": cls.BASELINE_SCRAP_RATE
            * cls.SCRAP_REDUCTION
            * 100 * cls.SCRAP_COST_PER_PART,  # Assume 100 parts/week
        }

    @classmethod
    def calculate_annual_metrics(cls) -> Dict[str, float]:
        """Calculate annual ROI metrics"""
        weekly = cls.calculate_weekly_savings()

        total_weekly_savings = sum(weekly.values())
        annual_savings = total_weekly_savings * 52

        # Platform costs
        annual_platform_cost = 15000  # licenses, support, hosting

        net_annual_savings = annual_savings - annual_platform_cost
        roi_percentage = (net_annual_savings / annual_platform_cost) * 100
        payback_months = (annual_platform_cost / total_weekly_savings) / 4.33  # weeks per month

        return {
            "annual_tool_savings": weekly["tool_savings"] * 52,
            "annual_downtime_savings": weekly["downtime_savings"] * 52,
            "annual_scrap_savings": weekly["scrap_savings_estimated"] * 52,
            "total_annual_savings": annual_savings,
            "annual_platform_cost": annual_platform_cost,
            "net_annual_savings": net_annual_savings,
            "roi_percentage": roi_percentage,
            "payback_months": payback_months,
            "break_even_date": (
                datetime.now() + timedelta(days=payback_months * 30)
            ).isoformat(),
        }

    @classmethod
    def get_roi_dashboard(cls) -> Dict:
        """Get complete ROI dashboard data"""
        annual = cls.calculate_annual_metrics()

        return {
            "title": "CNC Platform ROI Analysis",
            "summary": {
                "estimated_annual_savings": f"${annual['total_annual_savings']:,.0f}",
                "roi_percentage": f"{annual['roi_percentage']:.1f}%",
                "payback_period": f"{annual['payback_months']:.1f} months",
                "break_even_date": annual["break_even_date"],
            },
            "breakdown": {
                "tool_replacement_savings": f"${annual['annual_tool_savings'] / 52:,.0f}/week",
                "downtime_reduction_savings": f"${annual['annual_downtime_savings'] / 52:,.0f}/week",
                "scrap_reduction_savings": f"${annual['annual_scrap_savings'] / 52:,.0f}/week",
            },
            "improvements": {
                "tool_breakage_reduction": f"{cls.TOOL_BREAKAGE_REDUCTION * 100:.0f}%",
                "unplanned_downtime_reduction": f"{cls.DOWNTIME_REDUCTION * 100:.0f}%",
                "scrap_rate_reduction": f"{cls.SCRAP_REDUCTION * 100:.0f}%",
                "machine_utilization_improvement": "15%",
            },
            "metrics": {
                "baseline_breakage_per_week": cls.BASELINE_TOOL_BREAKAGE_PER_WEEK,
                "projected_breakage_per_week": (
                    cls.BASELINE_TOOL_BREAKAGE_PER_WEEK
                    * (1 - cls.TOOL_BREAKAGE_REDUCTION)
                ),
                "baseline_downtime_per_week": cls.BASELINE_UNPLANNED_DOWNTIME_HOURS_PER_WEEK,
                "projected_downtime_per_week": (
                    cls.BASELINE_UNPLANNED_DOWNTIME_HOURS_PER_WEEK
                    * (1 - cls.DOWNTIME_REDUCTION)
                ),
            },
        }
