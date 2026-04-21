import uuid
from datetime import datetime
from typing import Optional

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class RedemptionRead(SQLModel):
    id: uuid.UUID
    participant_id: uuid.UUID
    participant_display_name: Optional[str] = None
    participant_email: Optional[str] = None
    participant_username: Optional[str] = None
    item_id: uuid.UUID
    item_name: str
    point_cost: int
    redeemed_at: datetime
    fulfilled_at: Optional[datetime]
    fulfillment_notes: Optional[str]
    returned_at: Optional[datetime]
    return_notes: Optional[str]
    created_at: datetime


class RedemptionRedeem(SQLModel):
    idempotency_key: str = Field(min_length=1, max_length=120)

    @field_validator("idempotency_key")
    @classmethod
    def validate_idempotency_key(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("idempotency_key must not be blank")
        return trimmed


class RedemptionFulfill(SQLModel):
    fulfillment_notes: Optional[str] = None

    @field_validator("fulfillment_notes")
    @classmethod
    def validate_fulfillment_notes(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


class RedemptionReturn(SQLModel):
    idempotency_key: str = Field(min_length=1, max_length=120)
    return_notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator("idempotency_key")
    @classmethod
    def validate_idempotency_key(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("idempotency_key must not be blank")
        return trimmed

    @field_validator("return_notes")
    @classmethod
    def validate_return_notes(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None
