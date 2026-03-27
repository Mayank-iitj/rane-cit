#!/usr/bin/env python3
"""
Comprehensive system verification and testing script
Validates all components before production deployment
"""

import asyncio
import sys
import logging
from datetime import datetime

import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class SystemVerifier:
    """Verify all system components"""

    def __init__(self, api_url: str = "http://localhost:8000"):
        self.api_url = api_url
        self.results = {}
        self.client = httpx.AsyncClient(base_url=api_url, timeout=10)

    async def verify_api_health(self) -> bool:
        """Check API health endpoint"""
        try:
            response = await self.client.get("/health")
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✓ API Health: {data['status']}")
                self.results["api_health"] = True
                return True
        except Exception as e:
            logger.error(f"✗ API Health check failed: {e}")
            self.results["api_health"] = False
            return False

    async def verify_database(self) -> bool:
        """Check database connectivity"""
        try:
            response = await self.client.get("/health")
            data = response.json()
            db_status = data.get("services", {}).get("database", "offline")
            if db_status == "operational":
                logger.info("✓ Database: operational")
                self.results["database"] = True
                return True
        except Exception as e:
            logger.error(f"✗ Database check failed: {e}")
            self.results["database"] = False
            return False

    async def verify_ml_models(self) -> bool:
        """Check ML models status"""
        try:
            response = await self.client.get("/api/v1/predict/models/status")
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✓ ML Models: LSTM={data['lstm_model']}, XGBoost={data['xgb_model']}")
                self.results["ml_models"] = True
                return True
        except Exception as e:
            logger.error(f"✗ ML models check failed: {e}")
            self.results["ml_models"] = False
            return False

    async def verify_predictions(self) -> bool:
        """Test RUL prediction endpoint"""
        try:
            payload = {
                "spindle_speed": 5000,
                "feed_rate": 350,
                "vibration": 2.5,
                "temperature": 45,
                "acoustic_emission": 35
            }
            response = await self.client.post("/api/v1/predict/tool-health", json=payload)
            if response.status_code == 200:
                data = response.json()
                logger.info(
                    f"✓ Predictions: RUL={data['rul_minutes']:.1f}min, "
                    f"Health={data['health_score']:.1f}%, Conf={data['confidence']:.2f}"
                )
                self.results["predictions"] = True
                return True
        except Exception as e:
            logger.error(f"✗ Prediction test failed: {e}")
            self.results["predictions"] = False
            return False

    async def verify_anomaly_detection(self) -> bool:
        """Test anomaly detection endpoint"""
        try:
            payloads = [
                {
                    "name": "normal",
                    "vibration_x": 1.5,
                    "vibration_y": 1.5,
                    "vibration_z": 1.5,
                    "temperature": 45,
                    "acoustic_emission": 25
                },
                {
                    "name": "anomaly",
                    "vibration_x": 8.5,
                    "vibration_y": 8.2,
                    "vibration_z": 8.0,
                    "temperature": 65,
                    "acoustic_emission": 85
                }
            ]

            for payload in payloads:
                name = payload.pop("name")
                response = await self.client.post("/api/v1/detect/anomaly", json=payload)
                if response.status_code == 200:
                    data = response.json()
                    logger.info(
                        f"✓ Anomaly Detection ({name}): "
                        f"Flag={data['anomaly_flag']}, Severity={data['severity']}"
                    )

            self.results["anomaly_detection"] = True
            return True
        except Exception as e:
            logger.error(f"✗ Anomaly detection test failed: {e}")
            self.results["anomaly_detection"] = False
            return False

    async def verify_optimization(self) -> bool:
        """Test parameter optimization endpoint"""
        try:
            payload = {
                "current_feed_rate": 300,
                "current_spindle_speed": 4500,
                "tool_health": 75
            }
            response = await self.client.post("/api/v1/optimize/parameters", json=payload)
            if response.status_code == 200:
                data = response.json()
                logger.info(
                    f"✓ Optimization: "
                    f"Feed {data['recommended_feed_rate']:.1f} mm/min, "
                    f"Speed {data['recommended_spindle_speed']:.0f} RPM, "
                    f"Gain {data['efficiency_gain']:.1f}%"
                )
                self.results["optimization"] = True
                return True
        except Exception as e:
            logger.error(f"✗ Optimization test failed: {e}")
            self.results["optimization"] = False
            return False

    async def verify_machines_api(self) -> bool:
        """Test machines listing endpoint"""
        try:
            response = await self.client.get("/api/v1/machines")
            if response.status_code == 200:
                machines = response.json()
                logger.info(f"✓ Machines API: Found {len(machines)} machines")
                for machine in machines[:2]:
                    logger.info(f"  - {machine['machine_name']}: {machine['status']}")
                self.results["machines_api"] = True
                return True
        except Exception as e:
            logger.error(f"✗ Machines API test failed: {e}")
            self.results["machines_api"] = False
            return False

    async def verify_dashboard(self) -> bool:
        """Test dashboard stats endpoint"""
        try:
            response = await self.client.get("/api/v1/dashboard/stats")
            if response.status_code == 200:
                data = response.json()
                logger.info(
                    f"✓ Dashboard: "
                    f"{data['active_machines']} active, "
                    f"{data['alerts_today']} alerts, "
                    f"Avg health {data['avg_health']:.1f}%"
                )
                self.results["dashboard"] = True
                return True
        except Exception as e:
            logger.error(f"✗ Dashboard test failed: {e}")
            self.results["dashboard"] = False
            return False

    async def run_all_checks(self):
        """Run all verification checks"""
        logger.info("=" * 60)
        logger.info("CNC Intelligence Platform - System Verification")
        logger.info("=" * 60)
        logger.info(f"Testing API: {self.api_url}")
        logger.info("")

        checks = [
            ("API Health", self.verify_api_health),
            ("Database", self.verify_database),
            ("ML Models", self.verify_ml_models),
            ("Predictions", self.verify_predictions),
            ("Anomaly Detection", self.verify_anomaly_detection),
            ("Optimization", self.verify_optimization),
            ("Machines API", self.verify_machines_api),
            ("Dashboard", self.verify_dashboard),
        ]

        for name, check_func in checks:
            await check_func()
            await asyncio.sleep(0.5)

        logger.info("")
        logger.info("=" * 60)
        await self.print_summary()
        await self.client.aclose()

    async def print_summary(self):
        """Print verification summary"""
        passed = sum(1 for v in self.results.values() if v)
        total = len(self.results)

        logger.info(f"Summary: {passed}/{total} checks passed")

        if passed == total:
            logger.info("✓ System is ready for deployment!")
            return 0
        else:
            logger.warning(f"⚠ {total - passed} checks failed")
            logger.warning("Please review errors above and retry")
            return 1


async def main():
    """Main entry point"""
    verifier = SystemVerifier()
    exit_code = await verifier.run_all_checks()
    sys.exit(exit_code)


if __name__ == "__main__":
    asyncio.run(main())
