"""
Edge processing module for signal preprocessing
Runs on Raspberry Pi / Industrial PC near the CNC machine
Performs noise filtering, feature extraction, and local inference
"""

import logging
import numpy as np
from typing import Dict, List, Tuple
from collections import deque
from datetime import datetime

from pykalman import KalmanFilter
from scipy.signal import welch, stft
from scipy.fft import fft

logger = logging.getLogger(__name__)


class SignalBuffer:
    """Circular buffer for streaming signal data"""

    def __init__(self, size: int = 1000):
        self.size = size
        self.buffer = deque(maxlen=size)
        self.timestamps = deque(maxlen=size)

    def add(self, value: float, timestamp: datetime = None) -> None:
        """Add value to buffer"""
        self.buffer.append(value)
        self.timestamps.append(timestamp or datetime.utcnow())

    def get(self) -> np.ndarray:
        """Get buffer as numpy array"""
        return np.array(self.buffer)

    def get_recent(self, n: int) -> np.ndarray:
        """Get last n samples"""
        return np.array(list(self.buffer)[-n:])

    def is_full(self) -> bool:
        """Check if buffer is full"""
        return len(self.buffer) == self.size


class KalmanFilterProcessor:
    """Kalman filter for noise reduction"""

    def __init__(self, process_variance: float = 0.01, measurement_variance: float = 0.1):
        self.kf = KalmanFilter(
            transition_matrices=[[1]],
            observation_matrices=[[1]],
            initial_state_mean=0,
            initial_state_covariance=1,
            observation_covariance=measurement_variance,
            transition_covariance=process_variance,
        )
        self.filtered_state_means = None
        self.filtered_state_covariances = None

    def filter(self, data: np.ndarray) -> np.ndarray:
        """Apply Kalman filter to data"""
        if len(data) < 2:
            return data

        self.filtered_state_means, self.filtered_state_covariances = self.kf.filter(data)
        return self.filtered_state_means.flatten()

    def smooth(self, data: np.ndarray) -> np.ndarray:
        """Apply Kalman smoother (bidirectional filtering)"""
        if len(data) < 2:
            return data

        smoothed_state_means, _ = self.kf.smooth(data)
        return smoothed_state_means.flatten()


class FeatureExtractor:
    """Extract time-domain and frequency-domain features from signals"""

    @staticmethod
    def compute_rms(signal: np.ndarray) -> float:
        """Compute RMS (root mean square) value"""
        return float(np.sqrt(np.mean(signal**2)))

    @staticmethod
    def compute_kurtosis(signal: np.ndarray) -> float:
        """Compute kurtosis (impulsiveness indicator)"""
        # Fourth moment divided by variance squared
        mean = np.mean(signal)
        std = np.std(signal)
        if std == 0:
            return 0.0
        return float(np.mean(((signal - mean) / std) ** 4))

    @staticmethod
    def compute_skewness(signal: np.ndarray) -> float:
        """Compute skewness (asymmetry indicator)"""
        mean = np.mean(signal)
        std = np.std(signal)
        if std == 0:
            return 0.0
        return float(np.mean(((signal - mean) / std) ** 3))

    @staticmethod
    def compute_peak(signal: np.ndarray) -> float:
        """Compute peak value"""
        return float(np.max(np.abs(signal)))

    @staticmethod
    def compute_crest_factor(signal: np.ndarray) -> float:
        """Compute crest factor (peak / RMS)"""
        rms = FeatureExtractor.compute_rms(signal)
        if rms == 0:
            return 0.0
        peak = FeatureExtractor.compute_peak(signal)
        return peak / rms

    @staticmethod
    def compute_fft_energy_bands(
        signal: np.ndarray, 
        fs: float = 1000.0, 
        bands: List[Tuple[float, float]] = None
    ) -> Dict[str, float]:
        """Compute FFT energy in frequency bands"""
        if bands is None:
            # Default bands: 0-100Hz, 100-500Hz, 500-2000Hz
            bands = [(0, 100), (100, 500), (500, 2000)]

        fft_vals = np.abs(fft(signal))
        freqs = np.fft.fftfreq(len(signal), 1 / fs)

        energy = {}
        for i, (low, high) in enumerate(bands):
            mask = (freqs >= low) & (freqs <= high)
            band_key = f"band_{i}_{int(low)}-{int(high)}Hz"
            energy[band_key] = float(np.sum(fft_vals[mask] ** 2))

        return energy

    @staticmethod
    def compute_time_domain_features(signal: np.ndarray) -> Dict[str, float]:
        """Compute comprehensive time-domain feature set"""
        return {
            "rms": FeatureExtractor.compute_rms(signal),
            "peak": FeatureExtractor.compute_peak(signal),
            "crest_factor": FeatureExtractor.compute_crest_factor(signal),
            "kurtosis": FeatureExtractor.compute_kurtosis(signal),
            "skewness": FeatureExtractor.compute_skewness(signal),
            "std_dev": float(np.std(signal)),
            "mean": float(np.mean(signal)),
        }

    @staticmethod
    def compute_frequency_domain_features(
        signal: np.ndarray,
        fs: float = 1000.0
    ) -> Dict[str, float]:
        """Compute comprehensive frequency-domain features"""
        # Power spectral density using Welch's method
        freqs, psd = welch(signal, fs=fs, nperseg=256)

        # Dominant frequency
        dominant_freq_idx = np.argmax(psd)
        dominant_freq = freqs[dominant_freq_idx]

        # Total power
        total_power = float(np.trapz(psd, freqs))

        return {
            "dominant_freq": float(dominant_freq),
            "total_power": total_power,
            "max_psd": float(np.max(psd)),
            "mean_psd": float(np.mean(psd)),
        }


class EdgeProcessor:
    """Main edge processing pipeline"""

    def __init__(self, window_size: int = 512, sample_rate: float = 1000.0):
        self.window_size = window_size
        self.sample_rate = sample_rate

        # Signal buffers for each axis
        self.vibration_x_buffer = SignalBuffer(size=2000)
        self.vibration_y_buffer = SignalBuffer(size=2000)
        self.vibration_z_buffer = SignalBuffer(size=2000)

        # Kalman filters
        self.kf_x = KalmanFilterProcessor()
        self.kf_y = KalmanFilterProcessor()
        self.kf_z = KalmanFilterProcessor()

        # Feature extractor
        self.feature_extractor = FeatureExtractor()

        logger.info(f"Edge processor initialized (window={window_size}, fs={sample_rate}Hz)")

    async def process_vibration(
        self,
        vib_x: float,
        vib_y: float,
        vib_z: float,
    ) -> Dict[str, float]:
        """Process vibration signals from all axes"""

        # Add to buffers
        self.vibration_x_buffer.add(vib_x)
        self.vibration_y_buffer.add(vib_y)
        self.vibration_z_buffer.add(vib_z)

        # Extract features only if buffer has enough data
        features = {}

        if self.vibration_x_buffer.is_full():
            x_data = self.vibration_x_buffer.get()
            y_data = self.vibration_y_buffer.get()
            z_data = self.vibration_z_buffer.get()

            # Apply Kalman filter
            x_filtered = self.kf_x.filter(x_data)
            y_filtered = self.kf_y.filter(y_data)
            z_filtered = self.kf_z.filter(z_data)

            # Time-domain features
            x_time_features = self.feature_extractor.compute_time_domain_features(x_filtered)
            y_time_features = self.feature_extractor.compute_time_domain_features(y_filtered)
            z_time_features = self.feature_extractor.compute_time_domain_features(z_filtered)

            # Frequency-domain features
            x_freq_features = self.feature_extractor.compute_frequency_domain_features(
                x_filtered, self.sample_rate
            )
            y_freq_features = self.feature_extractor.compute_frequency_domain_features(
                y_filtered, self.sample_rate
            )
            z_freq_features = self.feature_extractor.compute_frequency_domain_features(
                z_filtered, self.sample_rate
            )

            # Combine with axis prefix
            features = {
                **{f"x_{k}": v for k, v in x_time_features.items()},
                **{f"y_{k}": v for k, v in y_time_features.items()},
                **{f"z_{k}": v for k, v in z_time_features.items()},
                **{f"x_{k}": v for k, v in x_freq_features.items()},
                **{f"y_{k}": v for k, v in y_freq_features.items()},
                **{f"z_{k}": v for k, v in z_freq_features.items()},
                # Combined RMS across all axes
                "vibration_rms_combined": float(
                    np.sqrt(
                        (np.mean(x_filtered**2) + np.mean(y_filtered**2) + np.mean(z_filtered**2))
                        / 3
                    )
                ),
            }

        return features

    async def get_edge_features(self) -> Dict[str, float]:
        """Get all computed edge features for ML inference"""
        if not self.vibration_x_buffer.is_full():
            return {}

        x_data = self.vibration_x_buffer.get()
        y_data = self.vibration_y_buffer.get()
        z_data = self.vibration_z_buffer.get()

        return await self.process_vibration(x_data[-1], y_data[-1], z_data[-1])


logger.info("Edge processing module loaded (Kalman, FFT, RMS, kurtosis, skewness)")
