import asyncio
import datetime
import hashlib
import secrets
import uuid

import jwt
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.domains.auth.models import ROLE_ADMIN, User
from app.domains.participants.crud import get_participant_by_id
from app.domains.participants.models import Participant
from app.domains.participants.service.profile_lookup_service import get_participant_for_user
from app.domains.points.crud import get_balance_for_participant
from app.domains.points.schemas import PointAwardCreate
from app.domains.points.service import award_points
from app.domains.zones import crud
from app.domains.zones.models import Zone, ZoneCheckIn, ZoneRegistration, ZoneScanRequest
from app.domains.zones.schemas import (
    AdminScanCheckInCreate,
    AdminScanCheckInRead,
    EventRegistrationCreate,
    EventRegistrationQrRead,
    MyPassesRead,
    MyRegistrationsRead,
    ZoneCatalogItemRead,
    ZonePassRead,
    ZoneRead,
    ZoneRegistrationRead,
)

QR_TOKEN_TTL = datetime.timedelta(hours=12)
QR_TOKEN_TYPE = "zone_registration_qr"
ZONE_CHECK_IN_REASON = "zone.event_check_in"
INVALID_QR_REASON = "expired_or_tampered_or_not_registered"
SCAN_REQUEST_WAIT_ATTEMPTS = 40
SCAN_REQUEST_WAIT_DELAY_SECONDS = 0.05
if hasattr(status, "HTTP_422_UNPROCESSABLE_CONTENT"):
    UNPROCESSABLE_QR_STATUS = status.HTTP_422_UNPROCESSABLE_CONTENT
else:
    UNPROCESSABLE_QR_STATUS = status.HTTP_422_UNPROCESSABLE_ENTITY


def _utcnow() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


def _generate_pass_code() -> str:
    return secrets.token_urlsafe(18)


def _generate_qr_jti() -> str:
    return uuid.uuid4().hex


def _serialize_zone_catalog_item(zone, registered_count: int) -> ZoneCatalogItemRead:
    return ZoneCatalogItemRead(
        id=zone.id,
        name=zone.name,
        shortName=zone.short_name,
        category=zone.category,
        type=zone.zone_type,
        tags=zone.tags or [],
        status=zone.status.value if hasattr(zone.status, "value") else str(zone.status),
        location=zone.location,
        points=zone.points,
        registeredCount=registered_count,
        color=zone.color,
    )


def _serialize_zone_read(zone, registered_count: int) -> ZoneRead:
    row = _serialize_zone_catalog_item(zone, registered_count)
    return ZoneRead(**row.model_dump(), createdAt=zone.created_at, updatedAt=zone.updated_at)


def _serialize_zone_registration(registration: ZoneRegistration) -> ZoneRegistrationRead:
    return ZoneRegistrationRead(
        zoneId=registration.zone_id,
        isActive=registration.is_active,
        code=registration.pass_code,
        checkedInAt=registration.checked_in_at,
    )


def _serialize_zone_pass(registration: ZoneRegistration) -> ZonePassRead:
    return ZonePassRead(
        zoneId=registration.zone_id,
        code=registration.pass_code,
        isActive=registration.is_active,
        checkedInAt=registration.checked_in_at,
    )


def _build_registration_qr_token(*, registration: ZoneRegistration, zone: Zone) -> str:
    payload = {
        "type": QR_TOKEN_TYPE,
        "registrationId": str(registration.id),
        "eventId": zone.short_name,
        "jti": registration.qr_jti,
        "iat": _utcnow(),
        "exp": registration.qr_expires_at,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _build_event_registration_response(
    *, registration: ZoneRegistration, zone: Zone
) -> EventRegistrationQrRead:
    return EventRegistrationQrRead(
        registrationId=registration.id,
        eventId=zone.short_name,
        qrToken=_build_registration_qr_token(registration=registration, zone=zone),
        qrExpiresAt=registration.qr_expires_at,
    )


def _decode_registration_qr_token(qr_token: str) -> dict:
    try:
        payload = jwt.decode(
            qr_token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise HTTPException(
            status_code=UNPROCESSABLE_QR_STATUS,
            detail=AdminScanCheckInRead(
                status="invalid_qr",
                reason=INVALID_QR_REASON,
            ).model_dump(mode="json"),
        )

    if payload.get("type") != QR_TOKEN_TYPE:
        raise HTTPException(
            status_code=UNPROCESSABLE_QR_STATUS,
            detail=AdminScanCheckInRead(
                status="invalid_qr",
                reason=INVALID_QR_REASON,
            ).model_dump(mode="json"),
        )
    return payload


def _normalize_utc_datetime(
    value: datetime.datetime, *, field_name: str
) -> datetime.datetime:
    if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be timezone-aware",
        )
    return value.astimezone(datetime.timezone.utc)


def _normalize_db_datetime(value: datetime.datetime) -> datetime.datetime:
    if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
        return value.replace(tzinfo=datetime.timezone.utc)
    return value.astimezone(datetime.timezone.utc)


def _build_scan_request_fingerprint(
    *, qr_token: str, scanner_device_id: str, scanned_at: datetime.datetime
) -> str:
    raw = f"{qr_token}|{scanner_device_id}|{scanned_at.isoformat()}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _build_points_idempotency_key(*, registration_id: uuid.UUID) -> str:
    return f"zone-check-in:{registration_id}"


def _ensure_scan_request_payload_match(
    *, existing: ZoneScanRequest, request_fingerprint: str
) -> None:
    if existing.request_fingerprint != request_fingerprint:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="idempotency_key already exists for a different scan payload",
        )


def _invalid_qr_response() -> AdminScanCheckInRead:
    return AdminScanCheckInRead(status="invalid_qr", reason=INVALID_QR_REASON)


def _scan_request_has_completed_response(request: ZoneScanRequest) -> bool:
    return "status" in request.response_payload


async def _wait_for_completed_scan_request(
    db: AsyncSession,
    *,
    idempotency_key: str,
    request_fingerprint: str,
) -> ZoneScanRequest | None:
    for _ in range(SCAN_REQUEST_WAIT_ATTEMPTS):
        existing = await crud.get_scan_request_by_idempotency_key(
            db,
            idempotency_key=idempotency_key,
        )
        if existing is None:
            await asyncio.sleep(SCAN_REQUEST_WAIT_DELAY_SECONDS)
            continue
        _ensure_scan_request_payload_match(
            existing=existing,
            request_fingerprint=request_fingerprint,
        )
        if _scan_request_has_completed_response(existing):
            return existing
        await asyncio.sleep(SCAN_REQUEST_WAIT_DELAY_SECONDS)
    return None


async def _resolve_participant_for_registration(
    db: AsyncSession,
    *,
    user: User,
    participant_id: uuid.UUID | None,
) -> Participant:
    if participant_id is None:
        participant = await get_participant_for_user(db, user=user)
        if participant is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participant profile not found",
            )
        return participant

    participant = await get_participant_by_id(db, participant_id)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant profile not found")

    is_admin = user.role and user.role.name == ROLE_ADMIN
    if not is_admin and participant.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return participant


async def _get_zone_or_404_by_id(db: AsyncSession, *, zone_id: uuid.UUID) -> Zone:
    zone = await crud.get_zone_by_id(db, zone_id=zone_id)
    if zone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
    return zone


async def _get_zone_or_404_by_short_name(db: AsyncSession, *, short_name: str) -> Zone:
    zone = await crud.get_zone_by_short_name(db, short_name=short_name)
    if zone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
    return zone


async def _ensure_registration(
    db: AsyncSession,
    *,
    participant_id: uuid.UUID,
    zone_id: uuid.UUID,
) -> tuple[ZoneRegistration, bool]:
    registration = await crud.get_registration_for_update(
        db,
        participant_id=participant_id,
        zone_id=zone_id,
    )
    now = _utcnow()
    qr_expires_at = now + QR_TOKEN_TTL
    if registration is not None:
        if registration.is_active:
            return registration, False
        updated = await crud.update_registration(
            db,
            registration=registration,
            is_active=True,
            pass_code=_generate_pass_code(),
            qr_jti=_generate_qr_jti(),
            qr_expires_at=qr_expires_at,
            checked_in_at=None,
            checked_in_by=None,
        )
        return updated, False

    for _ in range(5):
        try:
            async with db.begin_nested():
                created = await crud.create_registration(
                    db,
                    participant_id=participant_id,
                    zone_id=zone_id,
                    pass_code=_generate_pass_code(),
                    qr_jti=_generate_qr_jti(),
                    qr_expires_at=qr_expires_at,
                )
            return created, True
        except IntegrityError:
            existing = await crud.get_registration(
                db,
                participant_id=participant_id,
                zone_id=zone_id,
            )
            if existing is not None:
                if existing.is_active:
                    return existing, False
                updated = await crud.update_registration(
                    db,
                    registration=existing,
                    is_active=True,
                    pass_code=_generate_pass_code(),
                    qr_jti=_generate_qr_jti(),
                    qr_expires_at=qr_expires_at,
                    checked_in_at=None,
                    checked_in_by=None,
                )
                return updated, False

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Could not create zone registration due to token collision; retry",
    )


async def _ensure_fresh_registration_qr(
    db: AsyncSession, *, registration: ZoneRegistration
) -> ZoneRegistration:
    if _normalize_db_datetime(registration.qr_expires_at) > _utcnow():
        return registration
    return await crud.update_registration(
        db,
        registration=registration,
        is_active=registration.is_active,
        qr_jti=_generate_qr_jti(),
        qr_expires_at=_utcnow() + QR_TOKEN_TTL,
        checked_in_at=registration.checked_in_at,
        checked_in_by=registration.checked_in_by,
    )


def _serialize_scan_checked_in_response(
    *,
    check_in: ZoneCheckIn,
    participant: Participant,
    zone: Zone,
) -> AdminScanCheckInRead:
    return AdminScanCheckInRead(
        status="checked_in",
        checkInId=check_in.id,
        participantId=participant.id,
        participantName=participant.display_name,
        eventId=zone.short_name,
        eventName=zone.name,
        pointsAwarded=check_in.points_awarded,
        newPointsBalance=check_in.resulting_balance,
        checkedInAt=check_in.scanned_at,
    )


async def _serialize_scan_duplicate_response(
    db: AsyncSession,
    *,
    check_in: ZoneCheckIn | None,
    registration: ZoneRegistration,
    participant: Participant,
    zone: Zone,
) -> AdminScanCheckInRead:
    if check_in is not None:
        checked_in_at = check_in.scanned_at
        new_points_balance = check_in.resulting_balance
        check_in_id = check_in.id
    else:
        checked_in_at = registration.checked_in_at
        new_points_balance = await get_balance_for_participant(db, participant_id=participant.id)
        check_in_id = None

    return AdminScanCheckInRead(
        status="already_checked_in",
        checkInId=check_in_id,
        participantId=participant.id,
        participantName=participant.display_name,
        eventId=zone.short_name,
        eventName=zone.name,
        pointsAwarded=0,
        newPointsBalance=new_points_balance,
        checkedInAt=checked_in_at,
        message="Already scanned. No additional points awarded.",
    )


async def list_zones(db: AsyncSession) -> list[ZoneCatalogItemRead]:
    rows = await crud.list_active_zones_with_registration_counts(db)
    return [_serialize_zone_catalog_item(zone, registered_count) for zone, registered_count in rows]


async def get_zone_details(db: AsyncSession, *, zone_id: uuid.UUID) -> ZoneRead:
    row = await crud.get_zone_with_registration_count(db, zone_id=zone_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
    zone, registered_count = row
    return _serialize_zone_read(zone, registered_count)


async def register_for_zone(
    db: AsyncSession,
    *,
    zone_id: uuid.UUID,
    user: User,
) -> tuple[ZoneRegistrationRead, bool]:
    participant = await get_participant_for_user(db, user=user)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant profile not found")

    await _get_zone_or_404_by_id(db, zone_id=zone_id)
    registration, created = await _ensure_registration(
        db,
        participant_id=participant.id,
        zone_id=zone_id,
    )
    return _serialize_zone_registration(registration), created


async def create_event_registration(
    db: AsyncSession,
    *,
    event_id: str,
    payload: EventRegistrationCreate,
    user: User,
) -> tuple[EventRegistrationQrRead, bool]:
    participant = await _resolve_participant_for_registration(
        db,
        user=user,
        participant_id=payload.participantId,
    )
    zone = await _get_zone_or_404_by_short_name(db, short_name=event_id)
    registration, created = await _ensure_registration(
        db,
        participant_id=participant.id,
        zone_id=zone.id,
    )
    registration = await _ensure_fresh_registration_qr(db, registration=registration)
    return _build_event_registration_response(registration=registration, zone=zone), created


async def get_registration_qr(
    db: AsyncSession,
    *,
    registration_id: uuid.UUID,
    user: User,
) -> EventRegistrationQrRead:
    registration = await crud.get_registration_by_id_for_update(db, registration_id=registration_id)
    if registration is None or not registration.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

    participant = await get_participant_by_id(db, registration.participant_id)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant profile not found")

    is_admin = user.role and user.role.name == ROLE_ADMIN
    if not is_admin and participant.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    zone = await _get_zone_or_404_by_id(db, zone_id=registration.zone_id)
    registration = await _ensure_fresh_registration_qr(db, registration=registration)
    return _build_event_registration_response(registration=registration, zone=zone)


async def scan_registration_check_in(
    db: AsyncSession,
    *,
    payload: AdminScanCheckInCreate,
    idempotency_key: str,
    actor: User,
) -> tuple[AdminScanCheckInRead, int]:
    normalized_key = idempotency_key.strip()
    if not normalized_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Idempotency-Key must not be blank",
        )

    scanned_at = _normalize_utc_datetime(payload.scannedAt, field_name="scannedAt")
    request_fingerprint = _build_scan_request_fingerprint(
        qr_token=payload.qrToken,
        scanner_device_id=payload.scannerDeviceId,
        scanned_at=scanned_at,
    )

    try:
        async with db.begin_nested():
            scan_request = await crud.create_scan_request(
                db,
                idempotency_key=normalized_key,
                request_fingerprint=request_fingerprint,
                scanner_user_id=actor.id,
            )
    except IntegrityError:
        existing = await crud.get_scan_request_by_idempotency_key_for_update(
            db,
            idempotency_key=normalized_key,
        )
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="idempotency conflict detected; retry the scan",
            )
        _ensure_scan_request_payload_match(
            existing=existing,
            request_fingerprint=request_fingerprint,
        )
        if not _scan_request_has_completed_response(existing):
            existing = await _wait_for_completed_scan_request(
                db,
                idempotency_key=normalized_key,
                request_fingerprint=request_fingerprint,
            )
        if existing is None or not _scan_request_has_completed_response(existing):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="scan request is still being processed; retry shortly",
            )
        return AdminScanCheckInRead.model_validate(existing.response_payload), existing.response_status_code

    try:
        token_payload = _decode_registration_qr_token(payload.qrToken)
        registration_id = uuid.UUID(str(token_payload["registrationId"]))
    except (HTTPException, KeyError, ValueError, TypeError):
        invalid_payload = _invalid_qr_response()
        await crud.complete_scan_request(
            db,
            request=scan_request,
            response_status_code=UNPROCESSABLE_QR_STATUS,
            response_payload=invalid_payload.model_dump(mode="json"),
        )
        return invalid_payload, UNPROCESSABLE_QR_STATUS

    registration = await crud.get_registration_by_id_for_update(
        db,
        registration_id=registration_id,
    )
    if registration is None or not registration.is_active:
        invalid_payload = _invalid_qr_response()
        await crud.complete_scan_request(
            db,
            request=scan_request,
            response_status_code=UNPROCESSABLE_QR_STATUS,
            response_payload=invalid_payload.model_dump(mode="json"),
        )
        return invalid_payload, UNPROCESSABLE_QR_STATUS

    zone = await crud.get_zone_by_id(db, zone_id=registration.zone_id)
    participant = await get_participant_by_id(db, registration.participant_id)
    if zone is None or participant is None:
        invalid_payload = _invalid_qr_response()
        await crud.complete_scan_request(
            db,
            request=scan_request,
            response_status_code=UNPROCESSABLE_QR_STATUS,
            response_payload=invalid_payload.model_dump(mode="json"),
            registration_id=registration.id,
        )
        return invalid_payload, UNPROCESSABLE_QR_STATUS

    if (
        str(token_payload.get("eventId")) != zone.short_name
        or str(token_payload.get("jti")) != registration.qr_jti
    ):
        invalid_payload = _invalid_qr_response()
        await crud.complete_scan_request(
            db,
            request=scan_request,
            response_status_code=UNPROCESSABLE_QR_STATUS,
            response_payload=invalid_payload.model_dump(mode="json"),
            registration_id=registration.id,
        )
        return invalid_payload, UNPROCESSABLE_QR_STATUS

    existing_check_in = await crud.get_check_in_by_registration_id(
        db,
        registration_id=registration.id,
    )
    if registration.checked_in_at is not None or existing_check_in is not None:
        duplicate_payload = await _serialize_scan_duplicate_response(
            db,
            check_in=existing_check_in,
            registration=registration,
            participant=participant,
            zone=zone,
        )
        await crud.complete_scan_request(
            db,
            request=scan_request,
            response_status_code=status.HTTP_200_OK,
            response_payload=duplicate_payload.model_dump(mode="json"),
            registration_id=registration.id,
        )
        return duplicate_payload, status.HTTP_200_OK

    try:
        async with db.begin_nested():
            check_in = await crud.create_check_in(
                db,
                registration_id=registration.id,
                participant_id=participant.id,
                zone_id=zone.id,
                checked_in_by_user_id=actor.id,
                scanner_device_id=payload.scannerDeviceId,
                scanned_at=scanned_at,
            )
    except IntegrityError:
        existing_check_in = await crud.get_check_in_by_registration_id(
            db,
            registration_id=registration.id,
        )
        duplicate_payload = await _serialize_scan_duplicate_response(
            db,
            check_in=existing_check_in,
            registration=registration,
            participant=participant,
            zone=zone,
        )
        await crud.complete_scan_request(
            db,
            request=scan_request,
            response_status_code=status.HTTP_200_OK,
            response_payload=duplicate_payload.model_dump(mode="json"),
            registration_id=registration.id,
        )
        return duplicate_payload, status.HTTP_200_OK

    ledger_entry, new_balance = await award_points(
        db,
        payload=PointAwardCreate(
            participant_id=participant.id,
            amount=zone.points,
            reason=ZONE_CHECK_IN_REASON,
            reference_id=registration.id,
            idempotency_key=_build_points_idempotency_key(registration_id=registration.id),
            note=f"Zone check-in: {zone.name}",
        ),
        actor=actor,
    )
    check_in = await crud.update_check_in_award(
        db,
        check_in=check_in,
        points_awarded=zone.points,
        resulting_balance=new_balance,
        point_ledger_entry_id=ledger_entry.id,
    )
    await crud.update_registration(
        db,
        registration=registration,
        is_active=registration.is_active,
        checked_in_at=check_in.scanned_at,
        checked_in_by=actor.id,
    )

    checked_in_payload = _serialize_scan_checked_in_response(
        check_in=check_in,
        participant=participant,
        zone=zone,
    )
    await crud.complete_scan_request(
        db,
        request=scan_request,
        response_status_code=status.HTTP_200_OK,
        response_payload=checked_in_payload.model_dump(mode="json"),
        registration_id=registration.id,
    )
    return checked_in_payload, status.HTTP_200_OK


async def unregister_from_zone(
    db: AsyncSession,
    *,
    zone_id: uuid.UUID,
    user: User,
) -> ZoneRegistrationRead:
    participant = await get_participant_for_user(db, user=user)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant profile not found")

    await _get_zone_or_404_by_id(db, zone_id=zone_id)
    registration = await crud.get_registration_for_update(
        db,
        participant_id=participant.id,
        zone_id=zone_id,
    )
    if registration is None:
        return ZoneRegistrationRead(
            zoneId=zone_id,
            isActive=False,
            code="",
            checkedInAt=None,
        )

    if not registration.is_active:
        return _serialize_zone_registration(registration)

    updated = await crud.update_registration(
        db,
        registration=registration,
        is_active=False,
        checked_in_at=registration.checked_in_at,
        checked_in_by=registration.checked_in_by,
    )
    return _serialize_zone_registration(updated)


async def list_my_registrations(
    db: AsyncSession,
    *,
    user: User,
) -> MyRegistrationsRead:
    participant = await get_participant_for_user(db, user=user)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant profile not found")

    zone_ids = await crud.list_active_zone_ids_for_participant(db, participant_id=participant.id)
    return MyRegistrationsRead(zoneIds=zone_ids)


async def list_my_passes(
    db: AsyncSession,
    *,
    user: User,
) -> MyPassesRead:
    participant = await get_participant_for_user(db, user=user)
    if participant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant profile not found")

    rows = await crud.list_passes_for_participant(db, participant_id=participant.id)
    return MyPassesRead(passes=[_serialize_zone_pass(row) for row in rows])
