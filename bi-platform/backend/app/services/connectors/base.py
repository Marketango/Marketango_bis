from abc import ABC, abstractmethod
from typing import Any


class BaseConnector(ABC):
    """Abstract base class for all data source connectors."""

    @abstractmethod
    async def get_campaign_metrics(
        self,
        credentials: dict,
        account_id: str,
        date_from: str,
        date_to: str,
    ) -> dict:
        """
        Fetch campaign-level metrics for a date range.

        Args:
            credentials: Decrypted credential dict from api_credentials table
            account_id: Platform-specific account/customer ID
            date_from: ISO date string YYYY-MM-DD
            date_to: ISO date string YYYY-MM-DD

        Returns:
            Normalized metrics dict with 'campaigns' list and 'totals' dict
        """
        ...

    @abstractmethod
    async def refresh_oauth_token(self, *args: Any, **kwargs: Any) -> dict:
        """Refresh the OAuth token and return updated token data."""
        ...
