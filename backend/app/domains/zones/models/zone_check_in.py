import uuid
from datetime import datetime

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel

from app.utils.models.base import Base


class ZoneCheckInBase(SQLModel):
    registration_id: uuid.UUID = Field(foreign_key="zone_registrations.id", index=True)
    participant_id: uuid.UUID = Field(foreign_key="participants.id", index=True)
    zone_id: uuid.UUID = Field(foreign_key="zones.id", index=True)
    checked_in_by_user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    scanner_device_id: str = Field(max_length=80, index=True)
    scanned_at: datetime = Field(sa_type=DateTime(timezone=True))
    points_awarded: int = Field(default=0, ge=0)
    resulting_balance: int = Field(default=0, ge=0)
    point_ledger_entry_id: uuid.UUID | None = Field(default=None, foreign_key="point_ledger.id", index=True)


class ZoneCheckIn(Base, ZoneCheckInBase, table=True):
    __tablename__ = "zone_check_ins"
    __table_args__ = (
        UniqueConstraint("registration_id", name="uq_zone_check_ins_registration"),
        UniqueConstraint("point_ledger_entry_id", name="uq_zone_check_ins_point_ledger_entry"),
    )
