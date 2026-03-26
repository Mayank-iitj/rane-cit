"""
CNC Intelligence Platform - Data Simulator
Generates realistic CNC machine data for demo/testing
"""

import random
import time
from datetime import datetime
from typing import Dict, List, Optional
import threading
import logging

logger = logging.getLogger(__name__)

# Demo modes
class DemoMode:
    NORMAL = "normal"
    DEGRADATION = "degradation"
    ANOMALY = "anomaly"


class CNCDataSimulator:
    """
    Realistic CNC machine data generator.
    Simulates normal operation, tool degradation, and anomaly scenarios.
    """

    # Machine configurations
    MACHINES = [
        {"id": 1, "name": "CNC-Alpha", "location": "Building A, Line 1"},
        {"id": 2, "name": "CNC-Beta", "location": "Building A, Line 2"},
        {"id": 3, "name": "CNC-Gamma", "location": "Building B, Line 1"},
        {"id": 4, "name": "CNC-Delta", "location": "Building B, Line 2"},
    ]

    # Tool IDs
    TOOLS = ["T01", "T02", "T03", "T04", "T05"]

    def __init__(self):
        self.mode = DemoMode.NORMAL
        self.machine_states = {}  # Track degradation state per machine
        self.callbacks = []  # Callbacks for data subscribers

        # Initialize machine states
        for machine in self.MACHINES:
            self.machine_states[machine["id"]] = {
                "health": random.uniform(85, 98),
                "tool_id": random.choice(self.TOOLS),
                "degradation_rate": 0.0,
            }

    def set_mode(self, mode: str, machine_id: Optional[int] = None):
        """Set demo mode"""
        self.mode = mode
        logger.info(f"Demo mode set to: {mode}")

        if machine_id:
            self._apply_mode_to_machine(mode, machine_id)
        else:
            for mid in self.machine_states:
                self._apply_mode_to_machine(mode, mid)

    def _apply_mode_to_machine(self, mode: str, machine_id: int):
        """Apply mode to specific machine"""
        if machine_id not in self.machine_states:
            return

        state = self.machine_states[machine_id]

        if mode == DemoMode.NORMAL:
            state["degradation_rate"] = 0.001
            state["target_health"] = random.uniform(85, 98)
        elif mode == DemoMode.DEGRADATION:
            state["degradation_rate"] = 0.15
            state["target_health"] = random.uniform(40, 65)
        elif mode == DemoMode.ANOMALY:
            state["degradation_rate"] = 0.5
            state["target_health"] = random.uniform(20, 40)

    def subscribe(self, callback):
        """Subscribe to data stream"""
        self.callbacks.append(callback)

    def generate_sample(self, machine_id: int = 1) -> Dict:
        """
        Generate a single sample of CNC sensor data.

        Returns:
            Dictionary with all sensor readings
        """
        # Get machine state
        if machine_id not in self.machine_states:
            machine_id = 1
        state = self.machine_states[machine_id]

        # Update health based on degradation
        if self.mode == DemoMode.NORMAL:
            # Small random fluctuations around current health
            health_change = random.uniform(-0.1, 0.1)
            state["health"] = max(70, min(100, state["health"] + health_change))
        elif self.mode == DemoMode.DEGRADATION:
            # Gradual degradation
            state["health"] = max(20, state["health"] - state["degradation_rate"])
        elif self.mode == DemoMode.ANOMALY:
            # Rapid degradation
            state["health"] = max(10, state["health"] - state["degradation_rate"] * 2)

        health = state["health"]

        # Generate sensor values based on health
        if self.mode == DemoMode.ANOMALY and random.random() < 0.3:
            # Sudden anomaly spike
            return self._generate_anomaly_sample(machine_id, state)

        return self._generate_normal_sample(machine_id, state, health)

    def _generate_normal_sample(self, machine_id: int, state: Dict, health: float) -> Dict:
        """Generate normal sensor data based on health"""
        # Base values (for healthy tool)
        base_spindle = random.uniform(5500, 7500)
        base_feed = random.uniform(350, 500)
        base_vibration = random.uniform(0.8, 1.8)
        base_temp = random.uniform(28, 35)
        base_ae = random.uniform(15, 30)

        # Adjust based on health (lower health = worse parameters)
        health_factor = health / 100.0

        # Vibration increases as health decreases
        vibration = base_vibration + (1 - health_factor) * random.uniform(1, 4)

        # Temperature increases
        temp = base_temp + (1 - health_factor) * random.uniform(5, 20)

        # Acoustic emission increases
        ae = base_ae + (1 - health_factor) * random.uniform(10, 40)

        # Get machine info
        machine_info = next((m for m in self.MACHINES if m["id"] == machine_id), self.MACHINES[0])

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "machine_id": machine_id,
            "machine_name": machine_info["name"],
            "tool_id": state.get("tool_id", "T01"),
            "spindle_speed": round(base_spindle, 2),
            "feed_rate": round(base_feed, 2),
            "vibration_x": round(vibration * random.uniform(0.8, 1.2), 3),
            "vibration_y": round(vibration * random.uniform(0.8, 1.2), 3),
            "vibration_z": round(vibration * random.uniform(0.8, 1.2), 3),
            "vibration_rms": round(vibration, 3),
            "temperature": round(temp, 2),
            "acoustic_emission": round(ae, 2),
            "power_consumption": round(random.uniform(2.5, 4.5), 2),
            "health_score": round(health, 1),
            "status": "running" if self.mode != DemoMode.ANOMALY else random.choice(["running", "fault"]),
        }

    def _generate_anomaly_sample(self, machine_id: int, state: Dict) -> Dict:
        """Generate anomaly sample with spike"""
        machine_info = next((m for m in self.MACHINES if m["id"] == machine_id), self.MACHINES[0])

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "machine_id": machine_id,
            "machine_name": machine_info["name"],
            "tool_id": state.get("tool_id", "T01"),
            "spindle_speed": round(random.uniform(8000, 10000), 2),
            "feed_rate": round(random.uniform(600, 800), 2),
            "vibration_x": round(random.uniform(6, 10), 3),
            "vibration_y": round(random.uniform(6, 10), 3),
            "vibration_z": round(random.uniform(6, 10), 3),
            "vibration_rms": round(random.uniform(7, 12), 3),
            "temperature": round(random.uniform(55, 75), 2),
            "acoustic_emission": round(random.uniform(70, 100), 2),
            "power_consumption": round(random.uniform(5, 7), 2),
            "health_score": round(state["health"], 1),
            "status": "fault",
        }

    def generate_batch(self, num_samples: int = 1) -> List[Dict]:
        """Generate multiple samples for different machines"""
        samples = []
        for _ in range(num_samples):
            machine_id = random.choice([m["id"] for m in self.MACHINES])
            samples.append(self.generate_sample(machine_id))
        return samples


# Global simulator instance
_simulator = None


def get_simulator() -> CNCDataSimulator:
    """Get global simulator instance"""
    global _simulator
    if _simulator is None:
        _simulator = CNCDataSimulator()
    return _simulator


if __name__ == "__main__":
    # Test simulator
    sim = CNCDataSimulator()
    print("Normal mode:")
    print(sim.generate_sample(1))
    print("\nDegradation mode:")
    sim.set_mode(DemoMode.DEGRADATION, 1)
    print(sim.generate_sample(1))
    print("\nAnomaly mode:")
    sim.set_mode(DemoMode.ANOMALY, 1)
    print(sim.generate_sample(1))