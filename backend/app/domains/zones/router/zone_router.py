import uuid

from fastapi import APIRouter, Body, Depends, Header, Response, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.database import get_db
from app.domains.auth.models import ROLE_ADMIN, User
from app.domains.zones import controller
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
from app.utils.deps import get_current_user, require_roles

router = APIRouter(tags=["zones"])


@router.get("/zones", response_model=list[ZoneCatalogItemRead])
async def list_zones(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await controller.get_catalog(db)


@router.get("/zones/{zone_id}", response_model=ZoneRead)
async def get_zone(
    zone_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await controller.get_one(db, zone_id=zone_id)


@router.post(
    "/zones/{zone_id}/register",
    response_model=ZoneRegistrationRead,
    status_code=status.HTTP_200_OK,
)
async def register_for_zone(
    zone_id: uuid.UUID,
    response: Response,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    payload, created = await controller.register(db, zone_id=zone_id, user=user)
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return payload


@router.post(
    "/events/{event_id}/registrations",
    response_model=EventRegistrationQrRead,
    status_code=status.HTTP_200_OK,
)
async def register_for_event(
    event_id: str,
    response: Response,
    payload: EventRegistrationCreate = Body(default_factory=EventRegistrationCreate),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    body, created = await controller.register_event(db, event_id=event_id, payload=payload, user=user)
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return body


@router.get("/registrations/{registration_id}/qr", response_model=EventRegistrationQrRead)
async def get_registration_qr(
    registration_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await controller.registration_qr(db, registration_id=registration_id, user=user)


@router.post("/admin/scans/check-in", response_model=AdminScanCheckInRead)
async def scan_zone_check_in(
    payload: AdminScanCheckInCreate,
    response: Response,
    x_idempotency_key: str = Header(..., alias="X-Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(ROLE_ADMIN)),
):
    body, status_code = await controller.scan_check_in(
        db,
        payload=payload,
        idempotency_key=x_idempotency_key,
        user=user,
    )
    response.status_code = status_code
    return body


@router.delete("/zones/{zone_id}/register", response_model=ZoneRegistrationRead)
async def unregister_from_zone(
    zone_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await controller.unregister(db, zone_id=zone_id, user=user)


@router.get("/me/registrations", response_model=MyRegistrationsRead)
async def get_my_registrations(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await controller.my_registrations(db, user=user)


@router.get("/me/passes", response_model=MyPassesRead)
async def get_my_passes(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await controller.my_passes(db, user=user)
