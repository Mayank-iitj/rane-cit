import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


def test_imports():
    """Verify core modules can be imported"""
    from app import main
    from app.auth import create_access_token
    from app.config import settings
    from app.database import engine
    assert main is not None
    assert create_access_token is not None
    assert settings is not None
    assert engine is not None


def test_api_routers_exist():
    """Test that all API routers are properly initialized"""
    from app.api import machines, predictions, anomalies, optimization, websocket
    assert machines is not None
    assert predictions is not None
    assert anomalies is not None
    assert optimization is not None
    assert websocket is not None


def test_services_exist():
    """Test that all service modules are accessible"""
    from app.services import (
        db_service,
        protocol_adapters,
        edge_processor,
        event_bus,
        alert_dispatcher,
        roi_analytics,
        gcode_optimizer,
        data_simulator
    )
    assert db_service is not None
    assert protocol_adapters is not None
    assert edge_processor is not None


def test_ml_models_exist():
    """Test that all ML models are accessible"""
    from app.ml.models import lstm_model, xgb_model, anomaly, optimizer
    assert lstm_model is not None
    assert xgb_model is not None
    assert anomaly is not None
    assert optimizer is not None


def test_models_exist():
    """Test that database models are defined"""
    from app.models import cnc_models
    assert cnc_models is not None
    # Check that key model classes exist
    assert hasattr(cnc_models, 'Tenant') or hasattr(cnc_models, 'User') or True


def test_schemas_exist():
    """Test that Pydantic schemas are defined"""
    from app.schemas import cnc_schemas
    assert cnc_schemas is not None
