import asyncio
import json
import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import decrypt_credential, encrypt_credential
from app.models.api_credential import ApiCredential, ApiSource

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


async def refresh_expiring_tokens() -> None:
    """
    Finds credentials expiring within 5 minutes and refreshes their OAuth tokens.
    Runs every 60 seconds via APScheduler.
    Errors on individual credentials are isolated — one failure does not abort others.
    """
    threshold = datetime.now(timezone.utc) + timedelta(minutes=5)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ApiCredential).where(
                ApiCredential.token_expires_at <= threshold,
                ApiCredential.token_expires_at > datetime.now(timezone.utc),
            )
        )
        expiring = result.scalars().all()

        if not expiring:
            return

        logger.info(f"Found {len(expiring)} credentials expiring within 5 minutes")

        for cred in expiring:
            try:
                await _refresh_single(session, cred)
                logger.info(
                    f"Refreshed token for credential {cred.id} (source: {cred.source})"
                )
            except Exception as exc:
                logger.error(
                    f"Failed to refresh token for credential {cred.id} "
                    f"(source: {cred.source}): {exc}"
                )
                # Continue processing other credentials


async def _refresh_single(session, cred: ApiCredential) -> None:
    decrypted = json.loads(decrypt_credential(cred.encrypted_data))

    if cred.source in (ApiSource.GOOGLE_ADS, ApiSource.SEARCH_CONSOLE, ApiSource.GA4):
        from app.services.connectors.google_ads import GoogleAdsConnector

        connector = GoogleAdsConnector()
        new_data = await connector.refresh_oauth_token(decrypted["refresh_token"])
    elif cred.source == ApiSource.META_ADS:
        from app.services.connectors.meta_ads import MetaAdsConnector

        connector = MetaAdsConnector()
        new_data = await connector.refresh_oauth_token(decrypted["access_token"])
    else:
        logger.warning(f"No refresh handler for source {cred.source}")
        return

    decrypted.update(new_data)
    cred.encrypted_data = encrypt_credential(json.dumps(decrypted))

    expires_at_str = new_data.get("expires_at")
    if expires_at_str:
        cred.token_expires_at = datetime.fromisoformat(expires_at_str)

    await session.commit()


def start_scheduler() -> None:
    scheduler.add_job(
        refresh_expiring_tokens,
        trigger="interval",
        seconds=60,
        id="token_refresh",
        replace_existing=True,
        max_instances=1,  # Never run concurrent refresh jobs
        coalesce=True,
    )
    scheduler.start()
    logger.info("Token refresh scheduler started (interval: 60s)")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Token refresh scheduler stopped")
