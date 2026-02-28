import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decrypt_credential
from app.middleware.client_token import require_client_token
from app.middleware.jwt_auth import require_agency_user
from app.models.api_credential import ApiCredential, ApiSource
from app.models.client import Client
from app.models.user import User
from app.schemas.metrics import MetricsResponse
from app.services.alert_engine import alert_engine
from app.services.cache import cache_service
from app.services.connectors.ga4 import GA4Connector
from app.services.connectors.google_ads import GoogleAdsConnector
from app.services.connectors.meta_ads import MetaAdsConnector
from app.services.connectors.search_console import SearchConsoleConnector

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/metrics", tags=["metrics"])

SOURCES = ["google_ads", "meta_ads", "search_console", "ga4"]
BACKGROUND_RENEWAL_TTL_THRESHOLD = 1800  # Renew if < 30 min remaining


@router.get("/client/{client_slug}", response_model=MetricsResponse)
async def get_client_metrics_public(
    client_slug: str,
    date_from: str,
    date_to: str,
    background_tasks: BackgroundTasks,
    client: Client = Depends(require_client_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Public metrics endpoint — requires UUID client token.
    Cache-first: serves immediately from Redis; renews in background if near expiry.
    """
    return await _fetch_metrics(client, date_from, date_to, background_tasks, db)


@router.get("/admin/{client_id}", response_model=MetricsResponse)
async def get_client_metrics_admin(
    client_id: str,
    date_from: str,
    date_to: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_agency_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin metrics endpoint — requires agency JWT."""
    result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            Client.tenant_id == current_user.tenant_id,
        )
    )
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    return await _fetch_metrics(client, date_from, date_to, background_tasks, db)


async def _fetch_metrics(
    client: Client,
    date_from: str,
    date_to: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession,
) -> MetricsResponse:
    date_range = f"{date_from}:{date_to}"
    cached_data: dict[str, Optional[dict]] = {}
    cache_misses: list[str] = []
    from_cache = True

    # Try cache for each source
    for source in SOURCES:
        key = cache_service.build_key(client.tenant_id, client.id, source, date_range)
        data = await cache_service.get(key)
        if data is not None:
            cached_data[source] = data
            # Renew in background if near expiry
            ttl = await cache_service.get_ttl(key)
            if ttl < BACKGROUND_RENEWAL_TTL_THRESHOLD:
                background_tasks.add_task(
                    _refresh_and_cache,
                    client,
                    source,
                    date_from,
                    date_to,
                    date_range,
                    db,
                )
        else:
            cache_misses.append(source)
            from_cache = False

    # Fetch cache misses in parallel
    if cache_misses:
        fresh = await _fetch_sources_parallel(client, cache_misses, date_from, date_to, db)
        for source, data in fresh.items():
            cached_data[source] = data
            if data and "error" not in data:
                key = cache_service.build_key(
                    client.tenant_id, client.id, source, date_range
                )
                await cache_service.set(key, data)

    # Run alert detection
    target_cpa = float(client.target_cpa) if client.target_cpa else None
    alerts = alert_engine.detect_all(
        google_ads_data=cached_data.get("google_ads"),
        meta_ads_data=cached_data.get("meta_ads"),
        seo_data=cached_data.get("search_console"),
        ga4_data=cached_data.get("ga4"),
        target_cpa=target_cpa,
    )

    return MetricsResponse(
        client_id=client.id,
        date_from=date_from,
        date_to=date_to,
        google_ads=cached_data.get("google_ads"),
        meta_ads=cached_data.get("meta_ads"),
        search_console=cached_data.get("search_console"),
        ga4=cached_data.get("ga4"),
        alerts=[a.to_dict() for a in alerts],
        from_cache=from_cache,
    )


async def _fetch_sources_parallel(
    client: Client,
    sources: list[str],
    date_from: str,
    date_to: str,
    db: AsyncSession,
) -> dict[str, Optional[dict]]:
    tasks = {
        source: _fetch_single_source(client, source, date_from, date_to, db)
        for source in sources
    }
    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    data: dict[str, Optional[dict]] = {}
    for source, result in zip(tasks.keys(), results):
        if isinstance(result, Exception):
            logger.warning(f"Failed to fetch {source} for client {client.id}: {result}")
            data[source] = None
        else:
            data[source] = result
    return data


async def _fetch_single_source(
    client: Client,
    source: str,
    date_from: str,
    date_to: str,
    db: AsyncSession,
) -> Optional[dict]:
    result = await db.execute(
        select(ApiCredential).where(
            ApiCredential.client_id == client.id,
            ApiCredential.source == ApiSource(source),
        )
    )
    cred = result.scalar_one_or_none()
    if cred is None:
        return None

    credentials = json.loads(decrypt_credential(cred.encrypted_data))

    if source == "google_ads":
        connector = GoogleAdsConnector()
        return await connector.get_campaign_metrics(
            credentials, credentials["customer_id"], date_from, date_to
        )
    elif source == "meta_ads":
        connector = MetaAdsConnector()
        return await connector.get_campaign_metrics(
            credentials, credentials["account_id"], date_from, date_to
        )
    elif source == "search_console":
        connector = SearchConsoleConnector()
        return await connector.get_campaign_metrics(
            credentials, credentials["site_url"], date_from, date_to
        )
    elif source == "ga4":
        connector = GA4Connector()
        return await connector.get_campaign_metrics(
            credentials, credentials["property_id"], date_from, date_to
        )
    return None


async def _refresh_and_cache(
    client: Client,
    source: str,
    date_from: str,
    date_to: str,
    date_range: str,
    db: AsyncSession,
) -> None:
    """Background task: refresh a single cache entry."""
    try:
        data = await _fetch_single_source(client, source, date_from, date_to, db)
        if data:
            key = cache_service.build_key(client.tenant_id, client.id, source, date_range)
            await cache_service.set(key, data)
            logger.debug(f"Background cache refresh complete: {key}")
    except Exception as exc:
        logger.warning(f"Background cache refresh failed for {source}/{client.id}: {exc}")
