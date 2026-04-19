import uuid
from typing import Any

from sqlalchemy import JSON, Column, UniqueConstraint
from sqlmodel import Field, SQLModel

from app.utils.models.base import Base


class ZoneScanRequestBase(SQLModel):
    idempotency_key: str = Field(max_length=120, index=True)
    request_fingerprint: str = Field(max_length=64)
    scanner_user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    registration_id: uuid.UUID | None = Field(default=None, foreign_key="zone_registrations.id", index=True)
    response_status_code: int = Field(default=200)
    response_payload: dict[str, Any] = Field(sa_column=Column(JSON, nullable=False))


class ZoneScanRequest(Base, ZoneScanRequestBase, table=True):
    __tablename__ = "zone_scan_requests"
    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_zone_scan_requests_idempotency_key"),
    )
