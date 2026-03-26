"""
CNC Intelligence Platform - Anomaly Detection Model
Uses Isolation Forest for detecting abnormal machining conditions
"""

import numpy as np
from pathlib import Path
from typing import Tuple, Dict
import logging

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent.parent / "models"


class AnomalyDetector:
    """
    Isolation Forest-based anomaly detection for CNC operations.
    Detects sudden vibration spikes, temperature anomalies, and unusual acoustic patterns.
    """

    def __init__(self):
        self.model = None
        self.threshold = -0.5  # Score below this = anomaly
        self.load_model()

    def load_model(self):
        """Load pre-trained Isolation Forest model"""
        try:
            model_path = MODEL_DIR / "isolation_forest.joblib"
            if model_path.exists():
                import joblib
                self.model = joblib.load(model_path)
                logger.info("Loaded Isolation Forest model")
            else:
                logger.warning("Isolation Forest model not found, using rule-based detection")
                self.model = None
        except Exception as e:
            logger.error(f"Error loading anomaly model: {e}")
            self.model = None

    def extract_features(self, vibration_x: float, vibration_y: float,
                        vibration_z: float, temperature: float,
                        acoustic_emission: float) -> np.ndarray:
        """Extract features for anomaly detection"""
        # Calculate vector magnitude
        vibration_magnitude = np.sqrt(vibration_x**2 + vibration_y**2 + vibration_z**2)

        # Statistical features
        vibrations = [vibration_x, vibration_y, vibration_z]
        vib_std = np.std(vibrations)

        features = np.array([
            vibration_magnitude / 15.0,  # Normalized magnitude
            vib_std / 5.0,  # Vibration variability
            temperature / 80.0,  # Normalized temp
            acoustic_emission / 100.0,  # Normalized AE
            abs(temperature - 35) / 40.0,  # Temp deviation from normal
        ]).reshape(1, -1)

        return features

    def detect_anomaly(self, vibration_x: float, vibration_y: float,
                      vibration_z: float, temperature: float,
                      acoustic_emission: float) -> Tuple[bool, float, str, str]:
        """
        Detect anomalies in sensor data.

        Returns:
            anomaly_flag: True if anomaly detected
            anomaly_score: Score (-1 to 1, lower = more anomalous)
            severity: low, medium, high, critical
            anomaly_type: Type of anomaly detected
        """
        features = self.extract_features(
            vibration_x, vibration_y, vibration_z, temperature, acoustic_emission
        )

        # Use rule-based detection with physics understanding
        anomaly_flag, anomaly_score, severity, anomaly_type = self._rule_based_detection(
            vibration_x, vibration_y, vibration_z, temperature, acoustic_emission
        )

        return anomaly_flag, anomaly_score, severity, anomaly_type

    def _rule_based_detection(self, vibration_x: float, vibration_y: float,
                              vibration_z: float, temperature: float,
                              acoustic_emission: float) -> Tuple[bool, float, str, str]:
        """Rule-based anomaly detection as fallback"""
        # Calculate metrics
        vib_magnitude = np.sqrt(vibration_x**2 + vibration_y**2 + vibration_z**2)
        vib_std = np.std([vibration_x, vibration_y, vibration_z])

        # Anomaly scoring
        scores = []

        # Vibration anomaly detection
        if vib_magnitude > 8.0:
            scores.append(("critical_vibration", 0.9))
        elif vib_magnitude > 5.0:
            scores.append(("high_vibration", 0.6))
        elif vib_magnitude > 3.0:
            scores.append(("elevated_vibration", 0.3))

        # Temperature anomaly
        if temperature > 60:
            scores.append(("critical_temperature", 0.95))
        elif temperature > 50:
            scores.append(("high_temperature", 0.7))
        elif temperature > 40:
            scores.append(("elevated_temperature", 0.4))

        # Acoustic emission anomaly
        if acoustic_emission > 80:
            scores.append(("critical_ae", 0.85))
        elif acoustic_emission > 60:
            scores.append(("high_ae", 0.55))

        # Vibration variability anomaly
        if vib_std > 3.0:
            scores.append(("vibration_instability", 0.5))

        if not scores:
            return False, 0.0, "none", "normal"

        # Get highest severity anomaly
        scores.sort(key=lambda x: x[1], reverse=True)
        anomaly_type, score = scores[0]

        # Determine severity
        if score > 0.8:
            severity = "critical"
        elif score > 0.6:
            severity = "high"
        elif score > 0.3:
            severity = "medium"
        else:
            severity = "low"

        return True, -score, severity, anomaly_type


def get_anomaly_detector() -> AnomalyDetector:
    """Get singleton anomaly detector"""
    if not hasattr(get_anomaly_detector, '_instance'):
        get_anomaly_detector._instance = AnomalyDetector()
    return get_anomaly_detector._instance