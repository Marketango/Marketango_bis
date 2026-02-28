from typing import Optional
from pydantic import BaseModel


class MetricsResponse(BaseModel):
    client_id: str
    date_from: str
    date_to: str
    google_ads: Optional[dict] = None
    meta_ads: Optional[dict] = None
    search_console: Optional[dict] = None
    ga4: Optional[dict] = None
    alerts: list[dict] = []
    from_cache: bool = False
