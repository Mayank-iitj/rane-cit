"""
Event streaming service - Kafka/Redpanda abstraction
Real-time event publishing for telemetry, predictions, and alerts
"""

import logging
import json
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
from datetime import datetime

from app.config import settings

logger = logging.getLogger(__name__)


class EventPublisher(ABC):
    """Abstract base for event publishing"""

    @abstractmethod
    async def publish(self, topic: str, event: Dict[str, Any]) -> bool:
        """Publish event to topic"""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close publisher connection"""
        pass


class KafkaEventPublisher(EventPublisher):
    """Kafka/Redpanda event publisher"""

    def __init__(self):
        self.producer = None
        self._init_producer()

    def _init_producer(self):
        """Initialize Kafka producer"""
        try:
            from confluent_kafka import Producer

            config = {
                "bootstrap.servers": settings.KAFKA_BROKERS,
                "client.id": "cnc-platform-producer",
            }

            self.producer = Producer(config)
            logger.info(f"Kafka producer initialized: {settings.KAFKA_BROKERS}")
        except ImportError:
            logger.warning("Confluent Kafka not available, using mock mode")
            self.producer = None

    async def publish(self, topic: str, event: Dict[str, Any]) -> bool:
        """Publish event to Kafka topic"""
        if not self.producer:
            logger.debug(f"[MOCK] Publishing to {topic}: {event}")
            return True

        try:
            event_json = json.dumps(event, default=str)

            def delivery_report(err, msg):
                if err:
                    logger.error(f"Kafka delivery failed: {err}")
                else:
                    logger.debug(f"Event published to {msg.topic()}")

            self.producer.produce(topic, event_json.encode("utf-8"), callback=delivery_report)
            self.producer.flush(timeout=5)
            return True

        except Exception as e:
            logger.error(f"Error publishing event: {e}")
            return False

    async def close(self) -> None:
        """Close producer"""
        if self.producer:
            self.producer.flush()
            logger.info("Kafka producer closed")


class MQTTEventPublisher(EventPublisher):
    """MQTT fallback event publisher (for edge devices)"""

    def __init__(self):
        self.client = None
        self._init_client()

    def _init_client(self):
        """Initialize MQTT client"""
        try:
            import paho.mqtt.client as mqtt

            self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
            self.client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, 60)
            self.client.loop_start()
            logger.info(f"MQTT client initialized: {settings.MQTT_BROKER}:{settings.MQTT_PORT}")
        except ImportError:
            logger.warning("Paho MQTT not available")
            self.client = None

    async def publish(self, topic: str, event: Dict[str, Any]) -> bool:
        """Publish event to MQTT topic"""
        if not self.client:
            logger.debug(f"[MOCK] Publishing to MQTT {topic}: {event}")
            return True

        try:
            event_json = json.dumps(event, default=str)
            result = self.client.publish(topic, event_json)
            return result.rc == 0
        except Exception as e:
            logger.error(f"Error publishing MQTT event: {e}")
            return False

    async def close(self) -> None:
        """Close MQTT client"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("MQTT client closed")


class EventBus:
    """Central event bus for streaming service events"""

    def __init__(self, use_kafka: bool = True):
        if use_kafka:
            self.publisher = KafkaEventPublisher()
        else:
            self.publisher = MQTTEventPublisher()

    async def publish_telemetry(self, machine_id: str, sensor_data: Dict[str, Any]) -> bool:
        """Publish sensor telemetry event"""
        event = {
            "type": "telemetry",
            "machine_id": machine_id,
            "timestamp": datetime.utcnow().isoformat(),
            "data": sensor_data,
        }
        return await self.publisher.publish(settings.KAFKA_TOPIC_TELEMETRY, event)

    async def publish_prediction(
        self, machine_id: str, rul: float, health: float, confidence: float
    ) -> bool:
        """Publish RUL prediction event"""
        event = {
            "type": "prediction",
            "machine_id": machine_id,
            "timestamp": datetime.utcnow().isoformat(),
            "rul_minutes": rul,
            "health_score": health,
            "confidence": confidence,
        }
        return await self.publisher.publish(settings.KAFKA_TOPIC_PREDICTIONS, event)

    async def publish_alert(
        self,
        machine_id: str,
        alert_type: str,
        severity: str,
        title: str,
        message: str,
    ) -> bool:
        """Publish alert event"""
        event = {
            "type": "alert",
            "machine_id": machine_id,
            "alert_type": alert_type,
            "severity": severity,
            "title": title,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }
        return await self.publisher.publish(settings.KAFKA_TOPIC_ALERTS, event)

    async def close(self) -> None:
        """Close event bus"""
        await self.publisher.close()


# Global event bus instance
_event_bus: Optional[EventBus] = None


async def init_event_bus() -> None:
    """Initialize global event bus"""
    global _event_bus
    _event_bus = EventBus(use_kafka=True)
    logger.info("Event bus initialized")


async def close_event_bus() -> None:
    """Close event bus"""
    global _event_bus
    if _event_bus:
        await _event_bus.close()
        _event_bus = None


def get_event_bus() -> EventBus:
    """Get event bus instance"""
    if _event_bus is None:
        raise RuntimeError("Event bus not initialized. Call init_event_bus() first.")
    return _event_bus
