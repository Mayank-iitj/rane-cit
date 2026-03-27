"""
Protocol adapters for CNC machine connectivity
Abstractions for MTConnect, OPC-UA, and Modbus protocols
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class ProtocolType(str, Enum):
    """Supported CNC communication protocols"""
    MTCONNECT = "mtconnect"
    OPC_UA = "opc_ua"
    MODBUS = "modbus"
    MQTT = "mqtt"
    PROPRIETARY = "proprietary"


class CNCDataAdapter(ABC):
    """Abstract base for CNC data adapters"""

    def __init__(self, machine_id: str, config: Dict[str, Any]):
        self.machine_id = machine_id
        self.config = config
        self.is_connected = False
        self.last_update = None

    @abstractmethod
    async def connect(self) -> bool:
        """Connect to CNC machine"""
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from CNC machine"""
        pass

    @abstractmethod
    async def get_telemetry(self) -> Dict[str, Any]:
        """Get real-time sensor telemetry"""
        pass

    @abstractmethod
    async def set_parameter(self, param: str, value: float) -> bool:
        """Set machine parameter"""
        pass

    def _validate_telemetry(self, data: Dict[str, Any]) -> bool:
        """Validate telemetry data completeness"""
        required_fields = {
            "spindle_speed",
            "feed_rate",
            "vibration_x",
            "vibration_y",
            "vibration_z",
            "temperature",
        }
        return all(field in data for field in required_fields)


class MTConnectAdapter(CNCDataAdapter):
    """MTConnect protocol adapter (ISO 23110)"""

    async def connect(self) -> bool:
        """Connect to MTConnect agent"""
        try:
            logger.info(f"Connecting to MTConnect agent for {self.machine_id}...")
            # Implementation would use XML parsing and HTTP polling
            # Placeholder for demo
            self.is_connected = True
            logger.info(f"✓ Connected to MTConnect")
            return True
        except Exception as e:
            logger.error(f"MTConnect connection failed: {e}")
            return False

    async def disconnect(self) -> None:
        """Disconnect from MTConnect agent"""
        self.is_connected = False
        logger.info("Disconnected from MTConnect")

    async def get_telemetry(self) -> Dict[str, Any]:
        """Get telemetry from MTConnect XML stream"""
        if not self.is_connected:
            return {}

        # Placeholder implementation
        # Real implementation would:
        # 1. HTTP GET /current from MTConnect agent
        # 2. Parse XML response
        # 3. Extract data items and conditions
        # 4. Normalize to standard schema

        return {
            "timestamp": datetime.utcnow(),
            "spindle_speed": 3000,  # RPM
            "feed_rate": 250,  # mm/min
            "vibration_x": 2.5,
            "vibration_y": 2.3,
            "vibration_z": 2.1,
            "vibration_rms": 2.3,
            "temperature": 65.5,
            "acoustic_emission": 0.8,
            "power_consumption": 12.5,
        }

    async def set_parameter(self, param: str, value: float) -> bool:
        """Set parameter via MTConnect (may be read-only)"""
        logger.warning(f"MTConnect write operation not supported: {param}={value}")
        return False


class OPCUAAdapter(CNCDataAdapter):
    """OPC-UA protocol adapter (IEC 62541)"""

    def __init__(self, machine_id: str, config: Dict[str, Any]):
        super().__init__(machine_id, config)
        self.client = None

    async def connect(self) -> bool:
        """Connect to OPC-UA server"""
        try:
            logger.info(f"Connecting to OPC-UA server for {self.machine_id}...")
            # Implementation would use asyncua library
            # self.client = await AsyncioClient(url=self.config["opc_ua_url"]).connect()
            self.is_connected = True
            logger.info(f"✓ Connected to OPC-UA server")
            return True
        except Exception as e:
            logger.error(f"OPC-UA connection failed: {e}")
            return False

    async def disconnect(self) -> None:
        """Disconnect from OPC-UA server"""
        if self.client:
            # await self.client.disconnect()
            pass
        self.is_connected = False
        logger.info("Disconnected from OPC-UA server")

    async def get_telemetry(self) -> Dict[str, Any]:
        """Get telemetry from OPC-UA nodes"""
        if not self.is_connected:
            return {}

        # Placeholder for real OPC-UA node reading
        # Real implementation would read from OPC-UA nodes:
        # SpindleSpeed, FeedRate, Vibration_*, Temperature, etc.

        return {
            "timestamp": datetime.utcnow(),
            "spindle_speed": 2800,
            "feed_rate": 240,
            "vibration_x": 2.6,
            "vibration_y": 2.4,
            "vibration_z": 2.2,
            "vibration_rms": 2.4,
            "temperature": 64.8,
            "acoustic_emission": 0.75,
            "power_consumption": 11.8,
        }

    async def set_parameter(self, param: str, value: float) -> bool:
        """Set parameter via OPC-UA write"""
        try:
            logger.info(f"Setting OPC-UA parameter: {param}={value}")
            # Real implementation would write to OPC-UA node
            # node = self.client.nodes.root.get_child([...])
            # await node.set_value(value)
            return True
        except Exception as e:
            logger.error(f"OPC-UA set parameter failed: {e}")
            return False


class ModbusAdapter(CNCDataAdapter):
    """Modbus RTU/TCP protocol adapter"""

    def __init__(self, machine_id: str, config: Dict[str, Any]):
        super().__init__(machine_id, config)
        self.client = None

    async def connect(self) -> bool:
        """Connect to Modbus RTU/TCP device"""
        try:
            logger.info(f"Connecting to Modbus device for {self.machine_id}...")
            # Implementation would use pymodbus
            # self.client = ModbusClient(method="tcp", host=..., port=502)
            self.is_connected = True
            logger.info(f"✓ Connected to Modbus device")
            return True
        except Exception as e:
            logger.error(f"Modbus connection failed: {e}")
            return False

    async def disconnect(self) -> None:
        """Disconnect from Modbus device"""
        if self.client:
            # self.client.close()
            pass
        self.is_connected = False
        logger.info("Disconnected from Modbus device")

    async def get_telemetry(self) -> Dict[str, Any]:
        """Read telemetry from Modbus registers"""
        if not self.is_connected:
            return {}

        # Placeholder for real Modbus register reading
        # Real implementation would read holding/input registers
        # and convert from raw Modbus values to engineering units

        return {
            "timestamp": datetime.utcnow(),
            "spindle_speed": 3100,
            "feed_rate": 260,
            "vibration_x": 2.4,
            "vibration_y": 2.2,
            "vibration_z": 2.0,
            "vibration_rms": 2.2,
            "temperature": 66.0,
            "acoustic_emission": 0.85,
            "power_consumption": 13.0,
        }

    async def set_parameter(self, param: str, value: float) -> bool:
        """Set parameter via Modbus write"""
        try:
            logger.info(f"Setting Modbus parameter: {param}={value}")
            # Real implementation would write to holding registers
            return True
        except Exception as e:
            logger.error(f"Modbus set parameter failed: {e}")
            return False


class AdapterFactory:
    """Factory for creating protocol adapters"""

    _adapters = {
        ProtocolType.MTCONNECT: MTConnectAdapter,
        ProtocolType.OPC_UA: OPCUAAdapter,
        ProtocolType.MODBUS: ModbusAdapter,
    }

    @staticmethod
    def create_adapter(
        protocol: ProtocolType,
        machine_id: str,
        config: Dict[str, Any],
    ) -> CNCDataAdapter:
        """Create adapter for specified protocol"""
        adapter_class = AdapterFactory._adapters.get(protocol)
        if not adapter_class:
            raise ValueError(f"Unsupported protocol: {protocol}")

        logger.info(f"Creating {protocol.value} adapter for {machine_id}")
        return adapter_class(machine_id, config)

    @staticmethod
    def register_adapter(protocol: ProtocolType, adapter_class: type) -> None:
        """Register custom adapter"""
        AdapterFactory._adapters[protocol] = adapter_class
        logger.info(f"Registered adapter for {protocol.value}")
