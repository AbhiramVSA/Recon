import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel

from app.utils.models.base import Base


class RedemptionBase(SQLModel):
    fulfillment_notes: Optional[str] = Field(default=None, max_length=500)
    idempotency_key: str = Field(max_length=120, unique=True, index=True)
    item_name_snapshot: str = Field(max_length=100)
    point_cost_snapshot: int = Field(ge=1)
    return_notes: Optional[str] = Field(default=None, max_length=500)
    return_idempotency_key: Optional[str] = Field(default=None, max_length=120, unique=True, index=True)


class Redemption(Base, RedemptionBase, table=True):
    __tablename__ = "redemptions"

    participant_id: uuid.UUID = Field(foreign_key="participants.id", index=True)
    item_id: uuid.UUID = Field(foreign_key="shop_items.id", index=True)
    returned_by_user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id", index=True)
    redeemed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )
    fulfilled_at: Optional[datetime] = Field(default=None, sa_type=DateTime(timezone=True))
    returned_at: Optional[datetime] = Field(default=None, sa_type=DateTime(timezone=True))
