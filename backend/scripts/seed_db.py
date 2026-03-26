"""
Database initialization and seeding
Run after migrations to populate initial data
"""

import asyncio
import logging
from datetime import datetime

from app.database import init_db, close_db, get_session
from app.models.cnc_models import Tenant, User, CNCMachine
from app.services.db_service import MachineService

logger = logging.getLogger(__name__)


async def seed_demo_data():
    """Seed database with demo data"""
    logger.info("Seeding database with demo data...")

    await init_db()

    try:
        async for session in get_session():
            # Create default tenant
            tenant = Tenant(name="Demo Factory", description="Demo factory for testing")
            session.add(tenant)
            await session.flush()

            logger.info(f"Created tenant: {tenant.name}")

            # Create demo users
            admin_user = User(
                tenant_id=tenant.id,
                username="admin",
                email="admin@example.com",
                roles=["admin", "operator"],
            )
            operator_user = User(
                tenant_id=tenant.id,
                username="operator",
                email="operator@example.com",
                roles=["operator"],
            )
            viewer_user = User(
                tenant_id=tenant.id,
                username="viewer",
                email="viewer@example.com",
                roles=["viewer"],
            )

            session.add(admin_user)
            session.add(operator_user)
            session.add(viewer_user)
            await session.flush()

            logger.info(f"Created demo users")

            # Create demo machines
            machines_data = [
                {
                    "machine_name": "CNC-Alpha",
                    "controller_type": "Fanuc",
                    "location": "Building A, Line 1",
                },
                {
                    "machine_name": "CNC-Beta",
                    "controller_type": "Siemens",
                    "location": "Building A, Line 2",
                },
                {
                    "machine_name": "CNC-Gamma",
                    "controller_type": "Haas",
                    "location": "Building B, Line 1",
                },
                {
                    "machine_name": "CNC-Delta",
                    "controller_type": "Fanuc",
                    "location": "Building B, Line 2",
                },
            ]

            for machine_data in machines_data:
                machine = await MachineService.create_machine(
                    session,
                    tenant_id=tenant.id,
                    **machine_data,
                )
                logger.info(f"Created machine: {machine.machine_name}")

            await session.commit()
            logger.info("✓ Demo data seeding complete")

    except Exception as e:
        logger.error(f"Error seeding demo data: {e}", exc_info=True)
        raise

    finally:
        await close_db()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    asyncio.run(seed_demo_data())
