import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import String, Text, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class ApiSource(str, PyEnum):
    GOOGLE_ADS = "google_ads"
    META_ADS = "meta_ads"
    SEARCH_CONSOLE = "search_console"
    GA4 = "ga4"


class ApiCredential(Base, TimestampMixin):
    __tablename__ = "api_credentials"
    __table_args__ = (
        UniqueConstraint("client_id", "source", name="uq_client_api_source"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source: Mapped[ApiSource] = mapped_column(Enum(ApiSource), nullable=False)
    encrypted_data: Mapped[str] = mapped_column(Text, nullable=False)
    token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    client: Mapped["Client"] = relationship(back_populates="credentials")
