import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.client import Client
from app.models.client_token import ClientToken

logger = logging.getLogger(__name__)


async def require_client_token(
    token: Optional[str] = Query(default=None, description="UUID access token"),
    bi_client_token: Optional[str] = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> Client:
    """
    Validates client access via UUID token.
    Accepts token from query param (?token=UUID) or httpOnly cookie.
    Query param takes priority for initial link access.
    """
    raw_token = token or bi_client_token
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token required",
        )

    result = await db.execute(
        select(ClientToken).where(
            ClientToken.token == raw_token,
            ClientToken.is_revoked == False,
        )
    )
    client_token = result.scalar_one_or_none()

    if client_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        )

    if (
        client_token.expires_at is not None
        and client_token.expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired",
        )

    result = await db.execute(
        select(Client).where(
            Client.id == client_token.client_id,
            Client.is_active == True,
        )
    )
    client = result.scalar_one_or_none()

    if client is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client account is inactive",
        )

    return client
