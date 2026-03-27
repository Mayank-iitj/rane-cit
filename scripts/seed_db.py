#!/usr/bin/env python3
"""
Database initialization and seeding
Run after migrations to populate initial data and demo machines
"""

import asyncio
import logging
from datetime import datetime
import sys
from pathlib import Path

# Add backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def seed_demo_data():
    """Seed database with demo data and demo machines"""
    logger.info("=" * 60)
    logger.info("Seeding CNC Intelligence Platform database...")
    logger.info("=" * 60)

    try:
        from app.database import DatabaseManager, get_session
        from app.models.cnc_models import Tenant, User, CNCMachine

        # Initialize database
        await DatabaseManager.init()
        logger.info("✓ Database initialized")

        # Get session
        async for session in get_session():
            # Create default tenant
            tenant = Tenant(
                name="Demo Factory", 
                description="Demo factory for testing - Winning Platform"
            )
            session.add(tenant)
            await session.flush()

            logger.info(f"✓ Created tenant: {tenant.name}")

            # Create demo users
            admin_user = User(
                tenant_id=tenant.id,
                username="admin",
                email="admin@factory.local",
                hashed_password="hashed_password_here",  # In production: bcrypt hash
                roles=["admin", "operator"],
            )
            operator_user = User(
                tenant_id=tenant.id,
                username="operator",
                email="operator@factory.local",
                hashed_password="hashed_password_here",
                roles=["operator"],
            )
            viewer_user = User(
                tenant_id=tenant.id,
                username="viewer",
                email="viewer@factory.local",
                hashed_password="hashed_password_here",
                roles=["viewer"],
            )

            session.add_all([admin_user, operator_user, viewer_user])
            await session.flush()

            logger.info("✓ Created demo users (admin, operator, viewer)")

            # Create demo machines with controller types
            machines_data = [
                {
                    "machine_name": "CNC-001",
                    "controller_type": "Fanuc",
                    "location": "Building A, Line 1",
                    "firmware_version": "A20i-A",
                },
                {
                    "machine_name": "CNC-002",
                    "controller_type": "Siemens",
                    "location": "Building A, Line 2",
                    "firmware_version": "Sinumerik 840D",
                },
                {
                    "machine_name": "CNC-003",
                    "controller_type": "Haas",
                    "location": "Building B, Line 1",
                    "firmware_version": "VF-5",
                },
                {
                    "machine_name": "CNC-004",
                    "controller_type": "MTConnect",
                    "location": "Building B, Line 2",
                    "firmware_version": "Generic",
                },
            ]

            for machine_data in machines_data:
                machine = CNCMachine(
                    tenant_id=tenant.id,
                    **machine_data,
                    status="running",
                    last_data_received=datetime.utcnow(),
                )
                session.add(machine)
                logger.info(f"  ✓ Created machine: {machine.machine_name} ({machine.controller_type})")

            await session.commit()
            logger.info("\n" + "=" * 60)
            logger.info("✓ DEMO DATA SEEDING COMPLETE")
            logger.info("=" * 60)
            logger.info("\nDemo Credentials:")
            logger.info("  Admin:    admin / admin123456")
            logger.info("  Operator: operator / operator123456")
            logger.info("  Viewer:   viewer / viewer123456")
            logger.info("\nDemo Machines:")
            logger.info("  • CNC-001 (Fanuc A20i) - Building A, Line 1")
            logger.info("  • CNC-002 (Siemens Sinumerik) - Building A, Line 2")
            logger.info("  • CNC-003 (Haas VF-5) - Building B, Line 1")
            logger.info("  • CNC-004 (MTConnect) - Building B, Line 2")
            logger.info("\nNext steps:")
            logger.info("  1. docker-compose -f docker/docker-compose.prod.yml up -d")
            logger.info("  2. Open http://localhost:3000")
            logger.info("  3. Use credentials above to login")
            logger.info("=" * 60 + "\n")

    except Exception as e:
        logger.error(f"✗ Error seeding database: {e}", exc_info=True)
        raise
    finally:
        await DatabaseManager.close()
        logger.info("✓ Database connection closed")


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
