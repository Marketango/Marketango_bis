import json
import logging
from typing import Any, Optional

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """
    Redis-backed cache service.
    Key format: {tenant_id}:{client_id}:{source}:{date_range}
    TTL: 4 hours (configurable via REDIS_TTL env var)
    """

    def __init__(self) -> None:
        self._client: Optional[aioredis.Redis] = None

    async def get_client(self) -> aioredis.Redis:
        if self._client is None:
            self._client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._client

    def build_key(
        self, tenant_id: str, client_id: str, source: str, date_range: str
    ) -> str:
        """date_range format: YYYY-MM-DD:YYYY-MM-DD"""
        return f"{tenant_id}:{client_id}:{source}:{date_range}"

    async def get(self, key: str) -> Optional[dict]:
        try:
            client = await self.get_client()
            data = await client.get(key)
            if data is None:
                return None
            return json.loads(data)
        except Exception as e:
            logger.warning(f"Cache GET failed for key {key}: {e}")
            return None

    async def set(self, key: str, value: dict, ttl: Optional[int] = None) -> None:
        try:
            client = await self.get_client()
            ttl = ttl or settings.REDIS_TTL
            await client.setex(key, ttl, json.dumps(value, default=str))
        except Exception as e:
            logger.warning(f"Cache SET failed for key {key}: {e}")

    async def delete(self, key: str) -> None:
        try:
            client = await self.get_client()
            await client.delete(key)
        except Exception as e:
            logger.warning(f"Cache DELETE failed for key {key}: {e}")

    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a glob pattern.
        Uses SCAN (not KEYS) to avoid blocking Redis on large keyspaces.
        """
        try:
            client = await self.get_client()
            cursor: int = 0
            deleted = 0
            while True:
                cursor, keys = await client.scan(cursor, match=pattern, count=100)
                if keys:
                    deleted += await client.delete(*keys)
                if cursor == 0:
                    break
            return deleted
        except Exception as e:
            logger.error(f"Cache DELETE PATTERN failed for {pattern}: {e}")
            return 0

    async def get_ttl(self, key: str) -> int:
        """Returns remaining TTL in seconds. -2 if key does not exist."""
        try:
            client = await self.get_client()
            return await client.ttl(key)
        except Exception:
            return -2

    async def invalidate_client(self, tenant_id: str, client_id: str) -> int:
        """Manually invalidate all cached metrics for a client (used from admin panel)."""
        pattern = f"{tenant_id}:{client_id}:*"
        count = await self.delete_pattern(pattern)
        logger.info(f"Invalidated {count} cache keys for client {client_id}")
        return count


cache_service = CacheService()
