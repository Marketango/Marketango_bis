import logging
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import generate_client_token
from app.middleware.jwt_auth import require_agency_admin, require_agency_user
from app.models.client import Client
from app.models.client_token import ClientToken
from app.models.user import User
from app.schemas.client import (
    ClientCreate,
    ClientResponse,
    ClientTokenCreate,
    ClientTokenResponse,
    ClientUpdate,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/clients", tags=["clients"])


@router.get("", response_model=List[ClientResponse])
async def list_clients(
    current_user: User = Depends(require_agency_user),
    db: AsyncSession = Depends(get_db),
):
    """List all clients for the current agency tenant."""
    result = await db.execute(
        select(Client)
        .where(Client.tenant_id == current_user.tenant_id)
        .order_by(Client.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate,
    current_user: User = Depends(require_agency_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new client (admin only)."""
    # Check slug uniqueness within tenant
    existing = await db.execute(
        select(Client).where(
            Client.tenant_id == current_user.tenant_id,
            Client.slug == payload.slug,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Client with slug '{payload.slug}' already exists",
        )

    client = Client(
        tenant_id=current_user.tenant_id,
        name=payload.name,
        slug=payload.slug,
        sector=payload.sector,
        target_cpa=payload.target_cpa,
        logo_url=payload.logo_url,
    )
    db.add(client)
    await db.flush()
    await db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    current_user: User = Depends(require_agency_user),
    db: AsyncSession = Depends(get_db),
):
    client = await _get_client_or_404(client_id, current_user.tenant_id, db)
    return client


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    payload: ClientUpdate,
    current_user: User = Depends(require_agency_admin),
    db: AsyncSession = Depends(get_db),
):
    client = await _get_client_or_404(client_id, current_user.tenant_id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    await db.flush()
    await db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    current_user: User = Depends(require_agency_admin),
    db: AsyncSession = Depends(get_db),
):
    client = await _get_client_or_404(client_id, current_user.tenant_id, db)
    await db.delete(client)


# ── Client Token Management ────────────────────────────────────────────────────

@router.post("/{client_id}/tokens", response_model=ClientTokenResponse)
async def create_client_token(
    client_id: str,
    payload: ClientTokenCreate,
    current_user: User = Depends(require_agency_admin),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new UUID access token for a client."""
    client = await _get_client_or_404(client_id, current_user.tenant_id, db)

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=payload.expires_days)
    token_value = generate_client_token()

    token = ClientToken(
        client_id=client.id,
        token=token_value,
        expires_at=expires_at,
        created_at=now,
    )
    db.add(token)
    await db.flush()
    await db.refresh(token)

    dashboard_url = f"https://marketango.co/cliente/{client.slug}?token={token_value}"

    return ClientTokenResponse(
        id=token.id,
        client_id=token.client_id,
        token=token.token,
        expires_at=token.expires_at,
        is_revoked=token.is_revoked,
        created_at=token.created_at,
        dashboard_url=dashboard_url,
    )


@router.delete("/{client_id}/tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_client_token(
    client_id: str,
    token_id: str,
    current_user: User = Depends(require_agency_admin),
    db: AsyncSession = Depends(get_db),
):
    """Revoke a specific client access token."""
    await _get_client_or_404(client_id, current_user.tenant_id, db)

    result = await db.execute(
        select(ClientToken).where(
            ClientToken.id == token_id,
            ClientToken.client_id == client_id,
        )
    )
    token = result.scalar_one_or_none()
    if token is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found")

    token.is_revoked = True


@router.post("/{client_id}/cache/invalidate")
async def invalidate_client_cache(
    client_id: str,
    current_user: User = Depends(require_agency_admin),
    db: AsyncSession = Depends(get_db),
):
    """Manually invalidate all Redis cache for a client."""
    from app.services.cache import cache_service

    client = await _get_client_or_404(client_id, current_user.tenant_id, db)
    deleted = await cache_service.invalidate_client(client.tenant_id, client.id)
    return {"message": f"Invalidated {deleted} cache keys for client '{client.name}'"}


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _get_client_or_404(
    client_id: str, tenant_id: str, db: AsyncSession
) -> Client:
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.tenant_id == tenant_id)
    )
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client
