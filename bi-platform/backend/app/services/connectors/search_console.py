import asyncio
import logging
from typing import Any

from app.core.config import settings
from app.services.api_gateway import api_gateway
from app.services.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class SearchConsoleConnector(BaseConnector):
    """Fetches metrics from Google Search Console API."""

    SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

    def _build_service(self, credentials: dict):
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build

        creds = Credentials(
            token=credentials.get("access_token"),
            refresh_token=credentials["refresh_token"],
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            token_uri="https://oauth2.googleapis.com/token",
        )
        return build("searchconsole", "v1", credentials=creds)

    async def get_campaign_metrics(
        self,
        credentials: dict,
        account_id: str,  # site_url for Search Console, e.g. "https://example.com"
        date_from: str,
        date_to: str,
    ) -> dict:
        service = self._build_service(credentials)
        site_url = account_id

        # Fetch query-level data
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: service.searchanalytics()
            .query(
                siteUrl=site_url,
                body={
                    "startDate": date_from,
                    "endDate": date_to,
                    "dimensions": ["query"],
                    "rowLimit": 500,
                    "dataState": "final",
                },
            )
            .execute(),
        )

        # Fetch previous period for WoW comparison
        prev_from, prev_to = self._prev_period(date_from, date_to)
        prev_response = await loop.run_in_executor(
            None,
            lambda: service.searchanalytics()
            .query(
                siteUrl=site_url,
                body={
                    "startDate": prev_from,
                    "endDate": prev_to,
                    "dimensions": [],
                    "rowLimit": 1,
                    "dataState": "final",
                },
            )
            .execute(),
        )

        return self._parse_response(response, prev_response, date_from, date_to)

    def _parse_response(
        self,
        response: dict,
        prev_response: dict,
        date_from: str,
        date_to: str,
    ) -> dict:
        rows = response.get("rows", [])
        keywords = []
        total_impressions = 0
        total_clicks = 0

        for row in rows:
            impressions = row.get("impressions", 0)
            clicks = row.get("clicks", 0)
            ctr = row.get("ctr", 0.0)
            position = row.get("position", 0.0)

            keywords.append(
                {
                    "query": row["keys"][0],
                    "impressions": impressions,
                    "clicks": clicks,
                    "ctr": round(ctr, 4),
                    "position": round(position, 1),
                }
            )
            total_impressions += impressions
            total_clicks += clicks

        # Previous period totals for WoW calculation
        prev_rows = prev_response.get("rows", [])
        prev_impressions = (
            sum(r.get("impressions", 0) for r in prev_rows) if prev_rows else 0
        )

        avg_ctr = total_clicks / total_impressions if total_impressions > 0 else 0.0
        avg_position = (
            sum(k["position"] * k["impressions"] for k in keywords) / total_impressions
            if total_impressions > 0
            else 0.0
        )

        return {
            "source": "search_console",
            "date_from": date_from,
            "date_to": date_to,
            "keywords": keywords,
            "totals": {
                "impressions": total_impressions,
                "clicks": total_clicks,
                "avg_ctr": round(avg_ctr, 4),
                "avg_position": round(avg_position, 1),
            },
            "prev_total_impressions": prev_impressions,
        }

    def _prev_period(self, date_from: str, date_to: str) -> tuple[str, str]:
        from datetime import datetime, timedelta

        fmt = "%Y-%m-%d"
        d_from = datetime.strptime(date_from, fmt)
        d_to = datetime.strptime(date_to, fmt)
        delta = d_to - d_from
        prev_to = d_from - timedelta(days=1)
        prev_from = prev_to - delta
        return prev_from.strftime(fmt), prev_to.strftime(fmt)

    async def refresh_oauth_token(self, refresh_token: str) -> dict:
        response = await api_gateway.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        return response.json()
