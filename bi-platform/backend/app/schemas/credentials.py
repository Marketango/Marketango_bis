from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CredentialCreate(BaseModel):
    source: str
    data: dict  # Raw credential data — will be encrypted before DB storage
    token_expires_at: Optional[datetime] = None


class CredentialResponse(BaseModel):
    id: str
    client_id: str
    source: str
    token_expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    # NOTE: encrypted_data is NEVER returned in responses

    class Config:
        from_attributes = True
