import asyncio
import logging
from typing import Any

from app.core.config import settings
from app.services.api_gateway import api_gateway
from app.services.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class GA4Connector(BaseConnector):
    """Fetches metrics from Google Analytics Data API v1 (GA4)."""

    def _build_client(self, credentials: dict):
        from google.oauth2.credentials import Credentials
        from google.analytics.data_v1beta import BetaAnalyticsDataClient

        creds = Credentials(
            token=credentials.get("access_token"),
            refresh_token=credentials["refresh_token"],
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            token_uri="https://oauth2.googleapis.com/token",
        )
        return BetaAnalyticsDataClient(credentials=creds)

    async def get_campaign_metrics(
        self,
        credentials: dict,
        account_id: str,  # GA4 property_id, e.g. "123456789"
        date_from: str,
        date_to: str,
    ) -> dict:
        from google.analytics.data_v1beta.types import (
            DateRange,
            Dimension,
            Metric,
            RunReportRequest,
        )

        client = self._build_client(credentials)
        property_id = account_id

        # Main report: sessions, users, engagement, events
        request = RunReportRequest(
            property=f"properties/{property_id}",
            date_ranges=[DateRange(start_date=date_from, end_date=date_to)],
            dimensions=[Dimension(name="sessionDefaultChannelGroup")],
            metrics=[
                Metric(name="sessions"),
                Metric(name="totalUsers"),
                Metric(name="engagedSessions"),
                Metric(name="engagementRate"),
                Metric(name="averageSessionDuration"),
                Metric(name="screenPageViews"),
                Metric(name="conversions"),
                Metric(name="bounceRate"),
            ],
        )

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, lambda: client.run_report(request)
        )

        # Event counts report (for form_submit, scroll tracking)
        event_request = RunReportRequest(
            property=f"properties/{property_id}",
            date_ranges=[DateRange(start_date=date_from, end_date=date_to)],
            dimensions=[Dimension(name="eventName")],
            metrics=[Metric(name="eventCount")],
        )
        event_response = await loop.run_in_executor(
            None, lambda: client.run_report(event_request)
        )

        return self._parse_response(response, event_response, date_from, date_to)

    def _parse_response(
        self,
        response: Any,
        event_response: Any,
        date_from: str,
        date_to: str,
    ) -> dict:
        channels = []
        totals: dict[str, float] = {
            "sessions": 0,
            "users": 0,
            "engaged_sessions": 0,
            "conversions": 0,
            "pageviews": 0,
        }

        total_engagement_rate = 0.0
        total_avg_session_duration = 0.0
        channel_count = 0

        for row in response.rows:
            dims = [d.value for d in row.dimension_values]
            metrics = [m.value for m in row.metric_values]

            sessions = int(metrics[0] or 0)
            users = int(metrics[1] or 0)
            engaged = int(metrics[2] or 0)
            engagement_rate = float(metrics[3] or 0)
            avg_duration = float(metrics[4] or 0)
            pageviews = int(metrics[5] or 0)
            conversions = int(metrics[6] or 0)

            channel = {
                "channel": dims[0] if dims else "unknown",
                "sessions": sessions,
                "users": users,
                "engaged_sessions": engaged,
                "engagement_rate": round(engagement_rate, 4),
                "avg_session_duration": round(avg_duration, 1),
                "pageviews": pageviews,
                "conversions": conversions,
            }
            channels.append(channel)

            totals["sessions"] += sessions
            totals["users"] += users
            totals["engaged_sessions"] += engaged
            totals["conversions"] += conversions
            totals["pageviews"] += pageviews
            total_engagement_rate += engagement_rate
            total_avg_session_duration += avg_duration
            channel_count += 1

        avg_engagement = total_engagement_rate / channel_count if channel_count > 0 else 0.0
        avg_session_duration = (
            total_avg_session_duration / channel_count if channel_count > 0 else 0.0
        )

        # Parse event counts
        events: dict[str, int] = {}
        for row in event_response.rows:
            event_name = row.dimension_values[0].value
            count = int(row.metric_values[0].value or 0)
            events[event_name] = count

        totals["engagement_rate"] = round(avg_engagement, 4)
        totals["avg_session_duration"] = round(avg_session_duration, 1)

        return {
            "source": "ga4",
            "date_from": date_from,
            "date_to": date_to,
            "channels": channels,
            "totals": totals,
            "events": events,
            "form_submit_events": events.get("form_submit", 0),
        }

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
