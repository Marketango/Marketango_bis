import json
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decrypt_credential, encrypt_credential
from app.middleware.jwt_auth import require_agency_admin, require_agency_user
from app.models.api_credential import ApiCredential, ApiSource
from app.models.client import Client
from app.models.user import User
from app.schemas.credentials import CredentialCreate, CredentialResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/clients", tags=["credentials"])


@router.get("/{client_id}/credentials", response_model=List[CredentialResponse])
async def list_credentials(
    client_id: str,
    current_user: User = Depends(require_agency_user),
    db: AsyncSession = Depends(get_db),
):
    """List API credential sources for a client (no encrypted data returned)."""
    await _verify_client_access(client_id, current_user.tenant_id, db)

    result = await db.execute(
        select(ApiCredential).where(ApiCredential.client_id == client_id)
    )
    return result.scalars().all()


@router.put("/{client_id}/credentials/{source}", response_model=CredentialResponse)
async def upsert_credential(
    client_id: str,
    source: str,
    payload: CredentialCreate,
    current_user: User = Depends(require_agency_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create or update API credentials for a client. Data is encrypted with AES-256-GCM."""
    await _verify_client_access(client_id, current_user.tenant_id, db)

    try:
        api_source = ApiSource(source)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid source '{source}'. Must be one of: {[s.value for s in ApiSource]}",
        )

    # Encrypt the credential data
    encrypted = encrypt_credential(json.dumps(payload.data))

    result = await db.execute(
        select(ApiCredential).where(
            ApiCredential.client_id == client_id,
            ApiCredential.source == api_source,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.encrypted_data = encrypted
        existing.token_expires_at = payload.token_expires_at
        await db.flush()
        await db.refresh(existing)
        return existing
    else:
        cred = ApiCredential(
            client_id=client_id,
            source=api_source,
            encrypted_data=encrypted,
            token_expires_at=payload.token_expires_at,
        )
        db.add(cred)
        await db.flush()
        await db.refresh(cred)
        return cred


@router.delete(
    "/{client_id}/credentials/{source}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_credential(
    client_id: str,
    source: str,
    current_user: User = Depends(require_agency_admin),
    db: AsyncSession = Depends(get_db),
):
    """Remove API credentials for a source."""
    await _verify_client_access(client_id, current_user.tenant_id, db)

    try:
        api_source = ApiSource(source)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid source")

    result = await db.execute(
        select(ApiCredential).where(
            ApiCredential.client_id == client_id,
            ApiCredential.source == api_source,
        )
    )
    cred = result.scalar_one_or_none()
    if cred is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")
    await db.delete(cred)


async def _verify_client_access(
    client_id: str, tenant_id: str, db: AsyncSession
) -> Client:
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.tenant_id == tenant_id)
    )
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client
