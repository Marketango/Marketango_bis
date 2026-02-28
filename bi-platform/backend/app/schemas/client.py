from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
import re


class ClientCreate(BaseModel):
    name: str
    slug: str
    sector: Optional[str] = None
    target_cpa: Optional[float] = None
    logo_url: Optional[str] = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        if not re.match(r"^[a-z0-9][a-z0-9-]*[a-z0-9]$", v):
            raise ValueError(
                "Slug must be lowercase alphanumeric with hyphens (e.g. 'mi-cliente')"
            )
        return v


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None
    target_cpa: Optional[float] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None


class ClientResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    slug: str
    sector: Optional[str]
    target_cpa: Optional[float]
    logo_url: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClientTokenCreate(BaseModel):
    expires_days: int = 30


class ClientTokenResponse(BaseModel):
    id: str
    client_id: str
    token: str
    expires_at: Optional[datetime]
    is_revoked: bool
    created_at: datetime
    dashboard_url: str

    class Config:
        from_attributes = True
