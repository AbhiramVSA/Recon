import datetime
import uuid

from sqlalchemy import case, func
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.zones.models import Zone, ZoneCheckIn, ZoneRegistration, ZoneScanRequest

_UNCHANGED = object()


async def list_active_zones_with_registration_counts(
    db: AsyncSession,
) -> list[tuple[Zone, int]]:
    active_count = func.coalesce(
        func.sum(case((ZoneRegistration.is_active.is_(True), 1), else_=0)),
        0,
    )
    stmt = (
        select(Zone, active_count)
        .select_from(Zone)
        .join(ZoneRegistration, ZoneRegistration.zone_id == Zone.id, isouter=True)
        .where(Zone.is_active.is_(True))
        .group_by(Zone.id)
        .order_by(Zone.name.asc(), Zone.id.asc())
    )
    result = await db.exec(stmt)
    return [(row[0], int(row[1])) for row in result.all()]


async def get_zone_with_registration_count(
    db: AsyncSession, *, zone_id: uuid.UUID
) -> tuple[Zone, int] | None:
    active_count = func.coalesce(
        func.sum(case((ZoneRegistration.is_active.is_(True), 1), else_=0)),
        0,
    )
    stmt = (
        select(Zone, active_count)
        .select_from(Zone)
        .join(ZoneRegistration, ZoneRegistration.zone_id == Zone.id, isouter=True)
        .where(Zone.id == zone_id)
        .where(Zone.is_active.is_(True))
        .group_by(Zone.id)
    )
    result = await db.exec(stmt)
    row = result.one_or_none()
    if row is None:
        return None
    return row[0], int(row[1])


async def get_zone_by_id(
    db: AsyncSession, *, zone_id: uuid.UUID
) -> Zone | None:
    stmt = select(Zone).where(Zone.id == zone_id).where(Zone.is_active.is_(True))
    result = await db.exec(stmt)
    return result.one_or_none()


async def get_zone_by_short_name(
    db: AsyncSession, *, short_name: str
) -> Zone | None:
    normalized = short_name.strip().lower()
    stmt = (
        select(Zone)
        .where(func.lower(Zone.short_name) == normalized)
        .where(Zone.is_active.is_(True))
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def get_registration_for_update(
    db: AsyncSession,
    *,
    participant_id: uuid.UUID,
    zone_id: uuid.UUID,
) -> ZoneRegistration | None:
    stmt = (
        select(ZoneRegistration)
        .where(ZoneRegistration.participant_id == participant_id)
        .where(ZoneRegistration.zone_id == zone_id)
        .with_for_update()
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def get_registration(
    db: AsyncSession,
    *,
    participant_id: uuid.UUID,
    zone_id: uuid.UUID,
) -> ZoneRegistration | None:
    stmt = (
        select(ZoneRegistration)
        .where(ZoneRegistration.participant_id == participant_id)
        .where(ZoneRegistration.zone_id == zone_id)
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def create_registration(
    db: AsyncSession,
    *,
    participant_id: uuid.UUID,
    zone_id: uuid.UUID,
    pass_code: str,
    qr_jti: str,
    qr_expires_at: datetime.datetime,
) -> ZoneRegistration:
    registration = ZoneRegistration(
        participant_id=participant_id,
        zone_id=zone_id,
        pass_code=pass_code,
        qr_jti=qr_jti,
        qr_expires_at=qr_expires_at,
        is_active=True,
    )
    db.add(registration)
    await db.flush()
    return registration


async def update_registration(
    db: AsyncSession,
    *,
    registration: ZoneRegistration,
    is_active: bool,
    pass_code: str | None = None,
    qr_jti: str | None = None,
    qr_expires_at: datetime.datetime | None = None,
    checked_in_at: datetime.datetime | None | object = _UNCHANGED,
    checked_in_by: uuid.UUID | None | object = _UNCHANGED,
) -> ZoneRegistration:
    registration.is_active = is_active
    if pass_code is not None:
        registration.pass_code = pass_code
    if qr_jti is not None:
        registration.qr_jti = qr_jti
    if qr_expires_at is not None:
        registration.qr_expires_at = qr_expires_at
    if checked_in_at is not _UNCHANGED:
        registration.checked_in_at = checked_in_at
    if checked_in_by is not _UNCHANGED:
        registration.checked_in_by = checked_in_by
    db.add(registration)
    await db.flush()
    return registration


async def list_active_zone_ids_for_participant(
    db: AsyncSession,
    *,
    participant_id: uuid.UUID,
) -> list[uuid.UUID]:
    stmt = (
        select(ZoneRegistration.zone_id)
        .where(ZoneRegistration.participant_id == participant_id)
        .where(ZoneRegistration.is_active.is_(True))
        .order_by(ZoneRegistration.created_at.asc(), ZoneRegistration.zone_id.asc())
    )
    result = await db.exec(stmt)
    return [row for row in result.all()]


async def list_passes_for_participant(
    db: AsyncSession,
    *,
    participant_id: uuid.UUID,
) -> list[ZoneRegistration]:
    stmt = (
        select(ZoneRegistration)
        .where(ZoneRegistration.participant_id == participant_id)
        .order_by(ZoneRegistration.created_at.asc(), ZoneRegistration.id.asc())
    )
    result = await db.exec(stmt)
    return list(result.all())


async def get_registration_by_id(
    db: AsyncSession, *, registration_id: uuid.UUID
) -> ZoneRegistration | None:
    stmt = select(ZoneRegistration).where(ZoneRegistration.id == registration_id)
    result = await db.exec(stmt)
    return result.one_or_none()


async def get_registration_by_id_for_update(
    db: AsyncSession, *, registration_id: uuid.UUID
) -> ZoneRegistration | None:
    stmt = (
        select(ZoneRegistration)
        .where(ZoneRegistration.id == registration_id)
        .with_for_update()
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def get_check_in_by_registration_id(
    db: AsyncSession, *, registration_id: uuid.UUID
) -> ZoneCheckIn | None:
    stmt = select(ZoneCheckIn).where(ZoneCheckIn.registration_id == registration_id)
    result = await db.exec(stmt)
    return result.one_or_none()


async def create_check_in(
    db: AsyncSession,
    *,
    registration_id: uuid.UUID,
    participant_id: uuid.UUID,
    zone_id: uuid.UUID,
    checked_in_by_user_id: uuid.UUID,
    scanner_device_id: str,
    scanned_at: datetime.datetime,
) -> ZoneCheckIn:
    check_in = ZoneCheckIn(
        registration_id=registration_id,
        participant_id=participant_id,
        zone_id=zone_id,
        checked_in_by_user_id=checked_in_by_user_id,
        scanner_device_id=scanner_device_id,
        scanned_at=scanned_at,
    )
    db.add(check_in)
    await db.flush()
    await db.refresh(check_in)
    return check_in


async def update_check_in_award(
    db: AsyncSession,
    *,
    check_in: ZoneCheckIn,
    points_awarded: int,
    resulting_balance: int,
    point_ledger_entry_id: uuid.UUID | None,
) -> ZoneCheckIn:
    check_in.points_awarded = points_awarded
    check_in.resulting_balance = resulting_balance
    check_in.point_ledger_entry_id = point_ledger_entry_id
    db.add(check_in)
    await db.flush()
    return check_in


async def get_scan_request_by_idempotency_key(
    db: AsyncSession, *, idempotency_key: str
) -> ZoneScanRequest | None:
    stmt = select(ZoneScanRequest).where(ZoneScanRequest.idempotency_key == idempotency_key)
    result = await db.exec(stmt)
    return result.one_or_none()


async def get_scan_request_by_idempotency_key_for_update(
    db: AsyncSession, *, idempotency_key: str
) -> ZoneScanRequest | None:
    stmt = (
        select(ZoneScanRequest)
        .where(ZoneScanRequest.idempotency_key == idempotency_key)
        .with_for_update()
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def create_scan_request(
    db: AsyncSession,
    *,
    idempotency_key: str,
    request_fingerprint: str,
    scanner_user_id: uuid.UUID,
) -> ZoneScanRequest:
    request = ZoneScanRequest(
        idempotency_key=idempotency_key,
        request_fingerprint=request_fingerprint,
        scanner_user_id=scanner_user_id,
        response_payload={},
        response_status_code=200,
    )
    db.add(request)
    await db.flush()
    return request


async def complete_scan_request(
    db: AsyncSession,
    *,
    request: ZoneScanRequest,
    response_status_code: int,
    response_payload: dict,
    registration_id: uuid.UUID | None = None,
) -> ZoneScanRequest:
    request.response_status_code = response_status_code
    request.response_payload = response_payload
    request.registration_id = registration_id
    db.add(request)
    await db.flush()
    return request


async def count_checked_in_zones_for_participant(
    db: AsyncSession,
    *,
    participant_id: uuid.UUID,
) -> int:
    stmt = (
        select(func.count(col(ZoneRegistration.id)))
        .where(ZoneRegistration.participant_id == participant_id)
        .where(ZoneRegistration.is_active.is_(True))
        .where(ZoneRegistration.checked_in_at.is_not(None))
    )
    result = await db.exec(stmt)
    return int(result.one())


async def count_active_zone_registrations_for_participant(
    db: AsyncSession,
    *,
    participant_id: uuid.UUID,
) -> int:
    stmt = (
        select(func.count(col(ZoneRegistration.id)))
        .where(ZoneRegistration.participant_id == participant_id)
        .where(ZoneRegistration.is_active.is_(True))
    )
    result = await db.exec(stmt)
    return int(result.one())


async def list_checked_in_zone_ids_for_participant(
    db: AsyncSession,
    *,
    participant_id: uuid.UUID,
) -> list[uuid.UUID]:
    stmt = (
        select(ZoneRegistration.zone_id)
        .where(ZoneRegistration.participant_id == participant_id)
        .where(ZoneRegistration.is_active.is_(True))
        .where(ZoneRegistration.checked_in_at.is_not(None))
        .order_by(ZoneRegistration.checked_in_at.asc(), ZoneRegistration.zone_id.asc())
    )
    result = await db.exec(stmt)
    return [row for row in result.all()]
