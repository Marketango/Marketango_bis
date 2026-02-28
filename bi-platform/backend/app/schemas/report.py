from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class ReportCreate(BaseModel):
    title: str
    date_from: date
    date_to: date


class ReportUpdate(BaseModel):
    title: Optional[str] = None
    layout_config: Optional[dict] = None


class ReportResponse(BaseModel):
    id: str
    client_id: str
    title: str
    date_from: date
    date_to: date
    layout_config: Optional[dict]
    ai_insights: Optional[dict]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
