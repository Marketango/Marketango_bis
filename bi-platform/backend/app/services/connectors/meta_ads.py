import asyncio
import logging
from typing import Any

from app.core.config import settings
from app.services.api_gateway import api_gateway
from app.services.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class MetaAdsConnector(BaseConnector):
    """Fetches metrics from Meta Marketing API."""

    INSIGHT_FIELDS = [
        "campaign_name",
        "campaign_id",
        "impressions",
        "clicks",
        "spend",
        "actions",
        "action_values",
        "ctr",
        "cpc",
        "frequency",
        "reach",
        "unique_clicks",
    ]

    def _init_api(self, access_token: str) -> None:
        from facebook_business.api import FacebookAdsApi

        FacebookAdsApi.init(
            app_id=settings.META_APP_ID,
            app_secret=settings.META_APP_SECRET,
            access_token=access_token,
        )

    async def get_campaign_metrics(
        self,
        credentials: dict,
        account_id: str,
        date_from: str,
        date_to: str,
    ) -> dict:
        self._init_api(credentials["access_token"])

        from facebook_business.adobjects.adaccount import AdAccount

        loop = asyncio.get_event_loop()
        insights = await loop.run_in_executor(
            None,
            lambda: list(
                AdAccount(f"act_{account_id}").get_insights(
                    fields=self.INSIGHT_FIELDS,
                    params={
                        "time_range": {"since": date_from, "until": date_to},
                        "level": "campaign",
                    },
                )
            ),
        )
        return self._parse_insights(insights, date_from, date_to)

    def _parse_insights(
        self, insights: list, date_from: str, date_to: str
    ) -> dict:
        campaigns = []
        totals: dict[str, float] = {
            "impressions": 0,
            "clicks": 0,
            "spend": 0.0,
            "conversions": 0.0,
            "conversion_value": 0.0,
        }

        for insight in insights:
            spend = float(insight.get("spend", 0))
            impressions = int(insight.get("impressions", 0))
            clicks = int(insight.get("clicks", 0))
            frequency = float(insight.get("frequency", 0))

            # Extract purchase conversions from actions array
            actions = insight.get("actions", [])
            action_values = insight.get("action_values", [])

            purchase_types = {
                "offsite_conversion.fb_pixel_purchase",
                "omni_purchase",
                "purchase",
            }
            conversions = sum(
                float(a["value"])
                for a in actions
                if a.get("action_type") in purchase_types
            )
            conversion_value = sum(
                float(a["value"])
                for a in action_values
                if a.get("action_type") in purchase_types
            )

            roas = conversion_value / spend if spend > 0 else 0.0
            cpa = spend / conversions if conversions > 0 else 0.0

            campaign = {
                "id": insight.get("campaign_id"),
                "name": insight.get("campaign_name"),
                "impressions": impressions,
                "clicks": clicks,
                "spend": round(spend, 2),
                "conversions": round(conversions, 2),
                "conversion_value": round(conversion_value, 2),
                "ctr": round(float(insight.get("ctr", 0)), 4),
                "cpc": round(float(insight.get("cpc", 0)), 2),
                "frequency": round(frequency, 2),
                "reach": int(insight.get("reach", 0)),
                "roas": round(roas, 2),
                "cpa": round(cpa, 2),
            }
            campaigns.append(campaign)
            totals["impressions"] += impressions
            totals["clicks"] += clicks
            totals["spend"] += spend
            totals["conversions"] += conversions
            totals["conversion_value"] += conversion_value

        t = totals
        t["roas"] = round(
            t["conversion_value"] / t["spend"] if t["spend"] > 0 else 0.0, 2
        )
        t["cpa"] = round(
            t["spend"] / t["conversions"] if t["conversions"] > 0 else 0.0, 2
        )

        return {
            "source": "meta_ads",
            "date_from": date_from,
            "date_to": date_to,
            "campaigns": campaigns,
            "totals": {k: round(v, 2) if isinstance(v, float) else v for k, v in t.items()},
        }

    async def refresh_oauth_token(self, short_lived_token: str) -> dict:
        """Exchange for a long-lived token (valid ~60 days)."""
        response = await api_gateway.get(
            "https://graph.facebook.com/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.META_APP_ID,
                "client_secret": settings.META_APP_SECRET,
                "fb_exchange_token": short_lived_token,
            },
        )
        return response.json()
