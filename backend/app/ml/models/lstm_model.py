"""
CNC Intelligence Platform - LSTM Model for RUL Prediction
Deep learning model for remaining useful life estimation
"""

import numpy as np
import joblib
from pathlib import Path
from typing import Tuple
import logging

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

logger = logging.getLogger(__name__)

# Model paths
MODEL_DIR = Path(__file__).parent.parent.parent / "models"


class LSTMRULModel:
    """
    LSTM-based Remaining Useful Life (RUL) prediction model.
    Predicts tool wear and remaining life using sequence learning.
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.sequence_length = 50
        self.feature_dim = 6
        self._load_models()

    def _load_models(self):
        """Load pre-trained LSTM model and scaler"""
        try:
            model_path = MODEL_DIR / "lstm_rul_model.pt"
            scaler_path = MODEL_DIR / "feature_scaler.joblib"

            if model_path.exists() and TORCH_AVAILABLE:
                self.model = torch.jit.load(str(model_path))
                self.model.eval()
                logger.info("✓ Loaded PyTorch LSTM model")
            else:
                logger.info("LSTM PyTorch model not found, using physics-based fallback")
                self.model = None

            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                logger.info("✓ Loaded feature scaler")
        except Exception as e:
            logger.warning(f"Could not load LSTM models: {e}")
            self.model = None
            self.scaler = None

    def extract_features(self, spindle_speed: float, feed_rate: float,
                         vibration: float, temperature: float,
                         acoustic_emission: float) -> np.ndarray:
        """Extract normalized features from sensor data"""
        # Derived features for better prediction
        temp_rise = temperature - 20.0  # Ambient temp reference
        spindle_load = (feed_rate / max(spindle_speed, 1)) * 1000 if spindle_speed > 0 else 0
        
        # Feature vector (normalized)
        features = np.array([
            spindle_speed / 10000.0,
            feed_rate / 1000.0,
            vibration / 10.0,
            temp_rise / 50.0,
            acoustic_emission / 100.0,
            spindle_load / 10.0
        ], dtype=np.float32)

        return features

    def predict_rul(self, spindle_speed: float, feed_rate: float,
                     vibration: float, temperature: float,
                     acoustic_emission: float) -> Tuple[float, float, float]:
        """
        Predict Remaining Useful Life and health score.

        Returns:
            rul_minutes: Remaining useful life in minutes (0-500)
            health_score: Tool health percent (0-100)
            confidence: Prediction confidence (0-1)
        """
        # Extract and normalize features
        features = self.extract_features(
            spindle_speed, feed_rate, vibration, temperature, acoustic_emission
        )

        # Use PyTorch model if available, else physics-based fallback
        if self.model is not None and TORCH_AVAILABLE:
            try:
                with torch.no_grad():
                    input_tensor = torch.from_numpy(features).unsqueeze(0).unsqueeze(0)
                    rul_pred, health_pred = self.model(input_tensor)
                    rul = float(rul_pred.item()) * 500
                    health = float(health_pred.item()) * 100
                confidence = 0.85
            except Exception as e:
                logger.warning(f"LSTM inference failed: {e}, using physics-based")
                rul, health = self._physics_based_prediction(
                    spindle_speed, feed_rate, vibration, temperature, acoustic_emission
                )
                confidence = 0.70
        else:
            # Fallback: physics-based estimation
            rul, health = self._physics_based_prediction(
                spindle_speed, feed_rate, vibration, temperature, acoustic_emission
            )
            confidence = 0.70

        return rul, health, confidence

    def _physics_based_prediction(self, spindle_speed: float, feed_rate: float,
                                   vibration: float, temperature: float,
                                   acoustic_emission: float) -> Tuple[float, float]:
        """Physics-based RUL estimation using tool wear relationships"""
        
        # Normalize inputs to 0-1 range
        vib_norm = min(vibration / 10.0, 1.0)
        temp_norm = max(0, min((temperature - 20) / 60.0, 1.0))
        ae_norm = min(acoustic_emission / 100.0, 1.0)
        
        # Wear indicator: weighted combination of degradation signals
        # Vibration (40%) + Temperature (30%) + Acoustic Emission (30%)
        wear_indicator = (vib_norm * 0.40 + temp_norm * 0.35 + ae_norm * 0.25)
        
        # Ensure range [0, 1]
        wear_indicator = max(0, min(1.0, wear_indicator))
        
        # Health score (inverse of wear)
        health_score = (1.0 - wear_indicator) * 100
        
        # RUL estimation: typical tool life 500 minutes
        base_rul = 500 * (1.0 - wear_indicator)
        
        # Operating condition adjustments
        # High spindle speed: decrease RUL
        speed_factor = max(0.5, 1.0 - (spindle_speed / 15000.0) * 0.2)
        # High feed rate: decrease RUL (more aggressive cutting)
        feed_factor = max(0.7, 1.0 - (feed_rate / 1000.0) * 0.15)
        
        rul_minutes = base_rul * speed_factor * feed_factor
        rul_minutes = max(1, min(rul_minutes, 500))
        
        return float(rul_minutes), float(health_score)

    def _calculate_confidence(self, vibration: float, temperature: float) -> float:
        """Calculate prediction confidence based on sensor data quality"""
        # Stability-based confidence
        vib_stable = 1.0 - min(max(vibration - 5.0, 0) / 10.0, 0.3)  # Penalize high vibration
        temp_stable = 1.0 - min(abs(temperature - 50) / 40.0, 0.3)  # Penalize extreme temps
        
        confidence = (vib_stable * 0.6 + temp_stable * 0.4)
        return max(0.60, min(0.95, confidence))


def get_lstm_model() -> LSTMRULModel:
    """Get singleton LSTM model instance"""
    if not hasattr(get_lstm_model, '_instance'):
        get_lstm_model._instance = LSTMRULModel()
    return get_lstm_model._instance


if __name__ == "__main__":
    # Test the model
    model = LSTMRULModel()
    rul, health, conf = model.predict_rul(
        spindle_speed=6000,
        feed_rate=400,
        vibration=3.5,
        temperature=55,
        acoustic_emission=40
    )
    print(f"RUL: {rul:.1f} minutes, Health: {health:.1f}%, Confidence: {conf:.2f}")