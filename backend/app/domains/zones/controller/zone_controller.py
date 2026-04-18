import uuid

from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.auth.models import User
from app.domains.zones.schemas import (
    AdminScanCheckInCreate,
    AdminScanCheckInRead,
    EventRegistrationCreate,
    EventRegistrationQrRead,
    MyPassesRead,
    MyRegistrationsRead,
    ZoneCatalogItemRead,
    ZoneRead,
    ZoneRegistrationRead,
)
from app.domains.zones.service import (
    create_event_registration,
    get_zone_details,
    get_registration_qr,
    list_my_passes,
    list_my_registrations,
    list_zones,
    register_for_zone,
    scan_registration_check_in,
    unregister_from_zone,
)


async def get_catalog(db: AsyncSession) -> list[ZoneCatalogItemRead]:
    return await list_zones(db)


async def get_one(db: AsyncSession, *, zone_id: uuid.UUID) -> ZoneRead:
    return await get_zone_details(db, zone_id=zone_id)


async def register(
    db: AsyncSession, *, zone_id: uuid.UUID, user: User
) -> tuple[ZoneRegistrationRead, bool]:
    return await register_for_zone(db, zone_id=zone_id, user=user)


async def register_event(
    db: AsyncSession,
    *,
    event_id: str,
    payload: EventRegistrationCreate,
    user: User,
) -> tuple[EventRegistrationQrRead, bool]:
    return await create_event_registration(db, event_id=event_id, payload=payload, user=user)


async def registration_qr(
    db: AsyncSession,
    *,
    registration_id: uuid.UUID,
    user: User,
) -> EventRegistrationQrRead:
    return await get_registration_qr(db, registration_id=registration_id, user=user)


async def scan_check_in(
    db: AsyncSession,
    *,
    payload: AdminScanCheckInCreate,
    idempotency_key: str,
    user: User,
) -> tuple[AdminScanCheckInRead, int]:
    return await scan_registration_check_in(
        db,
        payload=payload,
        idempotency_key=idempotency_key,
        actor=user,
    )


async def unregister(
    db: AsyncSession, *, zone_id: uuid.UUID, user: User
) -> ZoneRegistrationRead:
    return await unregister_from_zone(db, zone_id=zone_id, user=user)


async def my_registrations(
    db: AsyncSession, *, user: User
) -> MyRegistrationsRead:
    return await list_my_registrations(db, user=user)


async def my_passes(
    db: AsyncSession, *, user: User
) -> MyPassesRead:
    return await list_my_passes(db, user=user)
