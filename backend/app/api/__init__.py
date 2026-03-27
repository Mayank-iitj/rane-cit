"""
API Routes Module - CNC Intelligence Platform
"""

from . import machines
from . import predictions
from . import anomalies
from . import optimization
from . import websocket

__all__ = [
    "machines",
    "predictions",
    "anomalies",
    "optimization",
    "websocket",
]
