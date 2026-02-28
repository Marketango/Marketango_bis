import asyncio
import logging
import random
from typing import Any, Dict, Optional

import httpx
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

logger = logging.getLogger(__name__)


class RateLimitError(Exception):
    pass


class ApiGateway:
    """
    Centralized HTTP gateway for all external API calls.
    Enforces retry logic with exponential backoff + jitter.
    All external calls must go through this service.
    """

    def __init__(self) -> None:
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0, connect=10.0),
                limits=httpx.Limits(
                    max_connections=20, max_keepalive_connections=10
                ),
            )
        return self._client

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((httpx.TimeoutException, RateLimitError)),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def get(self, url: str, **kwargs: Any) -> httpx.Response:
        response = await self._get_client().get(url, **kwargs)
        await self._handle_rate_limit(response)
        response.raise_for_status()
        return response

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((httpx.TimeoutException, RateLimitError)),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def post(self, url: str, **kwargs: Any) -> httpx.Response:
        response = await self._get_client().post(url, **kwargs)
        await self._handle_rate_limit(response)
        response.raise_for_status()
        return response

    async def _handle_rate_limit(self, response: httpx.Response) -> None:
        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 5))
            jitter = random.uniform(0, 1)
            wait_time = retry_after + jitter
            logger.warning(f"Rate limited. Waiting {wait_time:.1f}s before retry.")
            await asyncio.sleep(wait_time)
            raise RateLimitError(f"Rate limited by {response.url}")

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


api_gateway = ApiGateway()
