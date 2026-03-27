"""
cnc-mayyanks-api — Demo Data Seeder
Seeds demo organizations, users, machines, and telemetry for instant demos
"""

from api.database.connection import DatabaseManager
from api.database.models import (
    Organization, User, Machine, Telemetry, Alert,
    MachineStatus, AlertSeverity, AlertType, UserRole,
)
from datetime import datetime, timedelta, timezone
import bcrypt
import random


async def seed_demo_data():
    """Seed demo data for cnc.mayyanks.app demos"""
    session = await DatabaseManager.get_session()

    try:
        from sqlalchemy import select, func

        # Check if data already exists
        result = await session.execute(select(func.count(Organization.id)))
        if result.scalar() > 0:
            return  # Already seeded

        # ── Organization ──
        org = Organization(
            name="CNC Mayyanks Demo Factory",
            slug="cnc-mayyanks-demo",
            plan="enterprise",
            max_machines=50,
        )
        session.add(org)
        await session.flush()

        # ── Admin User ──
        password_hash = bcrypt.hashpw(b"demo123456", bcrypt.gensalt()).decode()
        admin = User(
            email="admin@cnc.mayyanks.app",
            password_hash=password_hash,
            full_name="CNC Admin",
            role=UserRole.ADMIN,
            org_id=org.id,
        )
        session.add(admin)

        # ── Demo Machines ──
        machine_configs = [
            {"name": "Haas VF-2SS", "model": "VF-2SS", "manufacturer": "Haas", "serial_number": "CNC-001", "location": "Shop Floor A"},
            {"name": "DMG MORI DMU 50", "model": "DMU 50", "manufacturer": "DMG MORI", "serial_number": "CNC-002", "location": "Shop Floor A"},
            {"name": "Mazak QTN 200", "model": "QTN 200", "manufacturer": "Mazak", "serial_number": "CNC-003", "location": "Shop Floor B"},
            {"name": "Fanuc RoboDrill", "model": "α-D21LiB5", "manufacturer": "Fanuc", "serial_number": "CNC-004", "location": "Shop Floor B"},
        ]

        machines = []
        for cfg in machine_configs:
            m = Machine(
                org_id=org.id,
                status=random.choice([MachineStatus.RUNNING, MachineStatus.IDLE, MachineStatus.ONLINE]),
                last_heartbeat=datetime.now(timezone.utc),
                **cfg,
            )
            session.add(m)
            machines.append(m)

        await session.flush()

        # ── Demo Telemetry (last 2 hours) ──
        now = datetime.now(timezone.utc)
        for machine in machines:
            base_spindle = random.uniform(2000, 5000)
            base_temp = random.uniform(30, 45)
            base_vib = random.uniform(0.5, 2.5)

            for minutes_ago in range(120, 0, -2):
                t = now - timedelta(minutes=minutes_ago)
                tel = Telemetry(
                    machine_id=machine.id,
                    timestamp=t,
                    spindle_speed=base_spindle + random.gauss(0, 100),
                    feed_rate=random.uniform(200, 800),
                    temperature=base_temp + (120 - minutes_ago) * 0.05 + random.gauss(0, 1),
                    vibration=base_vib + random.gauss(0, 0.3),
                    load_percent=random.uniform(40, 85),
                    power_consumption=random.uniform(800, 3500),
                    tool_id=f"T{random.randint(1, 8):02d}",
                    tool_wear=min(100, random.uniform(5, 30) + (120 - minutes_ago) * 0.1),
                    coolant_flow=random.uniform(10, 25),
                    coolant_temp=random.uniform(18, 28),
                    axis_positions={"x": random.uniform(-300, 300), "y": random.uniform(-200, 200), "z": random.uniform(-150, 0)},
                )
                session.add(tel)

        # ── Demo Alerts ──
        alert_templates = [
            {"type": AlertType.ANOMALY, "severity": AlertSeverity.WARNING, "title": "Vibration anomaly detected", "metric_name": "vibration", "metric_value": 5.2},
            {"type": AlertType.THRESHOLD, "severity": AlertSeverity.CRITICAL, "title": "Temperature exceeded threshold", "metric_name": "temperature", "metric_value": 78.5, "threshold_value": 75.0},
            {"type": AlertType.PREDICTIVE, "severity": AlertSeverity.WARNING, "title": "Tool wear approaching limit", "metric_name": "tool_wear", "metric_value": 85.0},
            {"type": AlertType.MAINTENANCE, "severity": AlertSeverity.INFO, "title": "Scheduled maintenance due in 48h"},
        ]

        for idx, machine in enumerate(machines[:3]):
            template = alert_templates[idx % len(alert_templates)]
            alert = Alert(
                machine_id=machine.id,
                org_id=org.id,
                message=f"Detected on {machine.name}",
                **template,
            )
            session.add(alert)

        await session.commit()

    except Exception as e:
        await session.rollback()
        raise
    finally:
        await session.close()
