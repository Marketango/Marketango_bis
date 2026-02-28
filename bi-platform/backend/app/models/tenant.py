import uuid
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    primary_color: Mapped[str] = mapped_column(String(7), default="#3B82F6")
    secondary_color: Mapped[str] = mapped_column(String(7), default="#1E40AF")

    users: Mapped[list["User"]] = relationship(back_populates="tenant", lazy="selectin")
    clients: Mapped[list["Client"]] = relationship(back_populates="tenant", lazy="selectin")
