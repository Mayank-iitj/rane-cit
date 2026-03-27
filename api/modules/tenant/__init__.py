"""
cnc-mayyanks-api — TenantModule
Multi-tenant organization management
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from api.database.connection import get_db
from api.database.models import Organization, User, Machine, UserRole
from api.modules.auth import get_current_user

router = APIRouter(prefix="/api/tenants", tags=["Tenants"])


class TenantCreate(BaseModel):
    name: str
    slug: str
    plan: str = "starter"
    max_machines: int = 10

class TenantResponse(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    max_machines: int
    user_count: int
    machine_count: int
    created_at: datetime

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    max_machines: Optional[int] = None
    settings: Optional[dict] = None


@router.get("", response_model=List[TenantResponse])
async def list_tenants(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List tenants (admin: all, others: own org only)"""
    if current_user.role == UserRole.ADMIN:
        result = await db.execute(select(Organization))
    else:
        result = await db.execute(
            select(Organization).where(Organization.id == current_user.org_id)
        )

    orgs = result.scalars().all()
    responses = []

    for org in orgs:
        user_count = (await db.execute(
            select(func.count(User.id)).where(User.org_id == org.id)
        )).scalar() or 0

        machine_count = (await db.execute(
            select(func.count(Machine.id)).where(Machine.org_id == org.id)
        )).scalar() or 0

        responses.append(TenantResponse(
            id=org.id, name=org.name, slug=org.slug,
            plan=org.plan, max_machines=org.max_machines,
            user_count=user_count, machine_count=machine_count,
            created_at=org.created_at,
        ))

    return responses


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get tenant details"""
    result = await db.execute(select(Organization).where(Organization.id == tenant_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Tenant not found")

    user_count = (await db.execute(
        select(func.count(User.id)).where(User.org_id == org.id)
    )).scalar() or 0

    machine_count = (await db.execute(
        select(func.count(Machine.id)).where(Machine.org_id == org.id)
    )).scalar() or 0

    return TenantResponse(
        id=org.id, name=org.name, slug=org.slug,
        plan=org.plan, max_machines=org.max_machines,
        user_count=user_count, machine_count=machine_count,
        created_at=org.created_at,
    )


@router.post("", response_model=TenantResponse, status_code=201)
async def create_tenant(
    body: TenantCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new tenant organization"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Check slug uniqueness
    existing = await db.execute(select(Organization).where(Organization.slug == body.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Slug already exists")

    org = Organization(
        name=body.name, slug=body.slug,
        plan=body.plan, max_machines=body.max_machines,
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)

    return TenantResponse(
        id=org.id, name=org.name, slug=org.slug,
        plan=org.plan, max_machines=org.max_machines,
        user_count=0, machine_count=0, created_at=org.created_at,
    )


@router.patch("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    body: TenantUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update tenant settings"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(select(Organization).where(Organization.id == tenant_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Tenant not found")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(org, key, value)
    await db.commit()
    await db.refresh(org)

    user_count = (await db.execute(
        select(func.count(User.id)).where(User.org_id == org.id)
    )).scalar() or 0
    machine_count = (await db.execute(
        select(func.count(Machine.id)).where(Machine.org_id == org.id)
    )).scalar() or 0

    return TenantResponse(
        id=org.id, name=org.name, slug=org.slug,
        plan=org.plan, max_machines=org.max_machines,
        user_count=user_count, machine_count=machine_count,
        created_at=org.created_at,
    )
