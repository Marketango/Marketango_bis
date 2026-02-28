import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from app.core.config import settings
from app.services.api_gateway import api_gateway
from app.services.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class GoogleAdsConnector(BaseConnector):
    """Fetches metrics from Google Ads API v17."""

    def _build_client(self, credentials: dict):
        from google.ads.googleads.client import GoogleAdsClient

        return GoogleAdsClient.load_from_dict(
            {
                "developer_token": credentials["developer_token"],
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": credentials["refresh_token"],
                "use_proto_plus": True,
            }
        )

    async def get_campaign_metrics(
        self,
        credentials: dict,
        account_id: str,
        date_from: str,
        date_to: str,
    ) -> dict:
        client = self._build_client(credentials)
        ga_service = client.get_service("GoogleAdsService")

        query = f"""
            SELECT
                campaign.id,
                campaign.name,
                campaign.status,
                campaign.advertising_channel_type,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions,
                metrics.conversions_value,
                metrics.ctr,
                metrics.average_cpc,
                metrics.search_impression_share,
                metrics.search_budget_lost_impression_share,
                metrics.search_rank_lost_impression_share
            FROM campaign
            WHERE segments.date BETWEEN '{date_from}' AND '{date_to}'
            AND campaign.status != 'REMOVED'
        """

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: list(
                ga_service.search(customer_id=account_id, query=query)
            ),
        )
        return self._parse_response(response, date_from, date_to)

    def _parse_response(self, response: list, date_from: str, date_to: str) -> dict:
        campaigns = []
        totals: dict[str, float] = {
            "impressions": 0,
            "clicks": 0,
            "cost": 0.0,
            "conversions": 0.0,
            "conversion_value": 0.0,
        }

        for row in response:
            cost = row.metrics.cost_micros / 1_000_000
            roas = (
                row.metrics.conversions_value / cost if cost > 0 else 0.0
            )
            cpa = (
                cost / row.metrics.conversions
                if row.metrics.conversions > 0
                else 0.0
            )

            campaign = {
                "id": str(row.campaign.id),
                "name": row.campaign.name,
                "channel_type": row.campaign.advertising_channel_type.name,
                "impressions": row.metrics.impressions,
                "clicks": row.metrics.clicks,
                "cost": round(cost, 2),
                "conversions": row.metrics.conversions,
                "conversion_value": row.metrics.conversions_value,
                "ctr": round(row.metrics.ctr, 4),
                "avg_cpc": round(row.metrics.average_cpc / 1_000_000, 2),
                "impression_share": row.metrics.search_impression_share,
                "is_lost_budget": row.metrics.search_budget_lost_impression_share,
                "is_lost_rank": row.metrics.search_rank_lost_impression_share,
                "roas": round(roas, 2),
                "cpa": round(cpa, 2),
            }
            campaigns.append(campaign)
            totals["impressions"] += campaign["impressions"]
            totals["clicks"] += campaign["clicks"]
            totals["cost"] += campaign["cost"]
            totals["conversions"] += campaign["conversions"]
            totals["conversion_value"] += campaign["conversion_value"]

        t = totals
        t["roas"] = round(
            t["conversion_value"] / t["cost"] if t["cost"] > 0 else 0.0, 2
        )
        t["cpa"] = round(
            t["cost"] / t["conversions"] if t["conversions"] > 0 else 0.0, 2
        )
        t["ctr"] = round(
            t["clicks"] / t["impressions"] if t["impressions"] > 0 else 0.0, 4
        )

        return {
            "source": "google_ads",
            "date_from": date_from,
            "date_to": date_to,
            "campaigns": campaigns,
            "totals": {k: round(v, 2) if isinstance(v, float) else v for k, v in t.items()},
        }

    async def refresh_oauth_token(self, refresh_token: str) -> dict:
        """Exchange refresh token for new access token."""
        response = await api_gateway.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        data = response.json()
        expires_at = datetime.now(timezone.utc).timestamp() + data["expires_in"]
        return {
            "access_token": data["access_token"],
            "expires_at": datetime.fromtimestamp(
                expires_at, tz=timezone.utc
            ).isoformat(),
        }
