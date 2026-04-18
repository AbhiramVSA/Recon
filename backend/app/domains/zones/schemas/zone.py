import datetime
import uuid

from sqlmodel import Field, SQLModel


class ZoneCatalogItemRead(SQLModel):
    id: uuid.UUID
    name: str
    shortName: str
    category: str
    type: str
    tags: list[str]
    status: str
    location: str
    points: int
    registrationRequired: bool
    registrationPoints: int
    checkInPoints: int
    registeredCount: int
    color: str


class ZoneRead(ZoneCatalogItemRead):
    createdAt: datetime.datetime
    updatedAt: datetime.datetime


class ZoneRegistrationRead(SQLModel):
    zoneId: uuid.UUID
    isActive: bool
    code: str
    checkedInAt: datetime.datetime | None = None
    pointsAwarded: int = 0
    newPointsBalance: int | None = None


class ZonePassRead(SQLModel):
    zoneId: uuid.UUID
    code: str
    isActive: bool
    checkedInAt: datetime.datetime | None = None


class MyRegistrationsRead(SQLModel):
    zoneIds: list[uuid.UUID]


class MyPassesRead(SQLModel):
    passes: list[ZonePassRead]


class EventRegistrationCreate(SQLModel):
    participantId: uuid.UUID | None = None


class EventRegistrationQrRead(SQLModel):
    registrationId: uuid.UUID
    eventId: str
    qrToken: str
    qrExpiresAt: datetime.datetime
    pointsAwarded: int = 0
    newPointsBalance: int | None = None


class AdminScanCheckInCreate(SQLModel):
    qrToken: str = Field(min_length=1, max_length=4096)
    scannerDeviceId: str = Field(min_length=1, max_length=80)
    scannedAt: datetime.datetime


class AdminScanCheckInRead(SQLModel):
    status: str
    checkInId: uuid.UUID | None = None
    participantId: uuid.UUID | None = None
    participantName: str | None = None
    eventId: str | None = None
    eventName: str | None = None
    pointsAwarded: int | None = None
    newPointsBalance: int | None = None
    checkedInAt: datetime.datetime | None = None
    message: str | None = None
    reason: str | None = None
