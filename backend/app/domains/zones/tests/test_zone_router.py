import datetime
import uuid
from uuid import uuid4

import jwt
import pytest
from sqlmodel import col, select

from app.core.config import settings
from app.domains.auth.models import ROLE_ADMIN
from app.domains.zones.models import Zone, ZoneRegistration


async def _create_zone(
    session_factory,
    *,
    name: str,
    short_name: str,
    is_active: bool = True,
    points: int | None = None,
    registration_required: bool = True,
    registration_points: int = 0,
    check_in_points: int = 0,
) -> Zone:
    async with session_factory() as session:
        zone = Zone(
            name=name,
            short_name=short_name,
            category="challenge",
            zone_type="booth",
            status="green",
            location="Hall A",
            points=registration_points if points is None else points,
            registration_required=registration_required,
            registration_points=registration_points,
            check_in_points=check_in_points,
            color="#22C55E",
            tags=["security", "network"],
            is_active=is_active,
        )
        session.add(zone)
        await session.commit()
        await session.refresh(zone)
        return zone


async def _create_profile(client, auth_override, user, *, display_name: str) -> uuid.UUID:
    auth_override(user)
    response = await client.post(
        "/api/v1/participants/me",
        json={"display_name": display_name, "institution": "VIT-AP", "year": 2},
    )
    assert response.status_code == 201
    return uuid.UUID(response.json()["id"])


@pytest.mark.asyncio
async def test_zone_catalog_and_detail(client, auth_override, create_user, session_factory):
    user = await create_user(email="zones-list@example.com", username="zoneslist")
    auth_override(user)

    zone_a = await _create_zone(
        session_factory,
        name="Network Warfare",
        short_name="NW",
        registration_points=100,
        check_in_points=0,
    )
    await _create_zone(session_factory, name="Legacy Inactive", short_name="LI", is_active=False)

    catalog = await client.get("/api/v1/zones")
    assert catalog.status_code == 200
    assert len(catalog.json()) == 1
    assert catalog.json()[0]["shortName"] == "NW"
    assert catalog.json()[0]["points"] == 100
    assert catalog.json()[0]["registrationRequired"] is True
    assert catalog.json()[0]["registrationPoints"] == 100
    assert catalog.json()[0]["checkInPoints"] == 0
    assert catalog.json()[0]["registeredCount"] == 0

    detail = await client.get(f"/api/v1/zones/{zone_a.id}")
    assert detail.status_code == 200
    assert detail.json()["id"] == str(zone_a.id)
    assert detail.json()["name"] == "Network Warfare"
    assert detail.json()["type"] == "booth"
    assert detail.json()["registrationRequired"] is True

    detail_by_short_name = await client.get("/api/v1/zones/NW")
    assert detail_by_short_name.status_code == 200
    assert detail_by_short_name.json()["id"] == str(zone_a.id)
    assert detail_by_short_name.json()["shortName"] == "NW"


@pytest.mark.asyncio
async def test_zone_register_unregister_and_me_endpoints(
    client, auth_override, create_user, session_factory
):
    user = await create_user(email="zones-reg@example.com", username="zonesreg")
    await _create_profile(client, auth_override, user, display_name="zone-regger")

    zone = await _create_zone(
        session_factory,
        name="Forensics",
        short_name="FORENSICS",
        registration_points=100,
    )

    auth_override(user)
    register = await client.post(f"/api/v1/zones/{zone.id}/register")
    assert register.status_code == 201
    first_code = register.json()["code"]
    assert register.json()["zoneId"] == str(zone.id)
    assert register.json()["isActive"] is True
    assert register.json()["pointsAwarded"] == 100
    assert register.json()["newPointsBalance"] == 100
    assert first_code

    register_again = await client.post(f"/api/v1/zones/{zone.id}/register")
    assert register_again.status_code == 200
    assert register_again.json()["code"] == first_code
    assert register_again.json()["pointsAwarded"] == 0
    assert register_again.json()["newPointsBalance"] == 100

    points_me = await client.get("/api/v1/points/me")
    assert points_me.status_code == 200
    assert points_me.json()["balance"] == 100

    regs = await client.get("/api/v1/me/registrations")
    assert regs.status_code == 200
    assert regs.json()["zoneIds"] == [str(zone.id)]

    passes = await client.get("/api/v1/me/passes")
    assert passes.status_code == 200
    assert len(passes.json()["passes"]) == 1
    assert passes.json()["passes"][0]["zoneId"] == str(zone.id)

    unregister = await client.delete(f"/api/v1/zones/{zone.id}/register")
    assert unregister.status_code == 200
    assert unregister.json()["isActive"] is False

    regs_after = await client.get("/api/v1/me/registrations")
    assert regs_after.status_code == 200
    assert regs_after.json()["zoneIds"] == []


@pytest.mark.asyncio
async def test_zone_register_unregister_accepts_short_name_identifier(
    client, auth_override, create_user, session_factory
):
    user = await create_user(email="zones-reg-short@example.com", username="zonesregshort")
    await _create_profile(client, auth_override, user, display_name="zone-reg-short")

    zone = await _create_zone(
        session_factory,
        name="Capture The Flag",
        short_name="ctf",
        registration_points=100,
    )

    auth_override(user)
    register = await client.post("/api/v1/zones/ctf/register")
    assert register.status_code == 201
    assert register.json()["zoneId"] == str(zone.id)
    assert register.json()["isActive"] is True
    assert register.json()["pointsAwarded"] == 100

    unregister = await client.delete("/api/v1/zones/CTF/register")
    assert unregister.status_code == 200
    assert unregister.json()["zoneId"] == str(zone.id)
    assert unregister.json()["isActive"] is False


@pytest.mark.asyncio
async def test_zone_register_rejects_zones_that_do_not_require_registration(
    client, auth_override, create_user, session_factory
):
    user = await create_user(email="zones-no-register@example.com", username="zonesnoreg")
    await _create_profile(client, auth_override, user, display_name="zone-no-register")

    zone = await _create_zone(
        session_factory,
        name="Art Zone",
        short_name="art",
        registration_required=False,
        registration_points=0,
        check_in_points=0,
        points=0,
    )

    auth_override(user)
    register = await client.post("/api/v1/zones/art/register")
    assert register.status_code == 400
    assert register.json()["detail"] == "This zone does not require registration"

    detail = await client.get(f"/api/v1/zones/{zone.id}")
    assert detail.status_code == 200
    assert detail.json()["registrationRequired"] is False
    assert detail.json()["points"] == 0


@pytest.mark.asyncio
async def test_event_registration_and_qr_fetch_returns_signed_token(
    client, auth_override, create_user, session_factory
):
    user = await create_user(email="zones-event@example.com", username="zonesevent")
    await _create_profile(client, auth_override, user, display_name="zone-event")
    zone = await _create_zone(
        session_factory,
        name="AppSec Zone",
        short_name="appsec",
        registration_points=100,
    )

    auth_override(user)
    register = await client.post("/api/v1/events/appsec/registrations")
    assert register.status_code == 201
    body = register.json()
    assert body["eventId"] == "appsec"
    assert body["registrationId"]
    assert body["qrToken"]
    assert body["qrExpiresAt"]
    assert body["pointsAwarded"] == 100
    assert body["newPointsBalance"] == 100

    decoded = jwt.decode(
        body["qrToken"],
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
    assert decoded["registrationId"] == body["registrationId"]
    assert decoded["eventId"] == zone.short_name
    assert decoded["type"] == "zone_registration_qr"

    qr = await client.get(f"/api/v1/registrations/{body['registrationId']}/qr")
    assert qr.status_code == 200
    assert qr.json()["registrationId"] == body["registrationId"]
    assert qr.json()["eventId"] == "appsec"


@pytest.mark.asyncio
async def test_registration_qr_fetch_rotates_when_existing_token_has_expired(
    client, auth_override, create_user, session_factory
):
    user = await create_user(email="zones-refresh@example.com", username="zonesrefresh")
    await _create_profile(client, auth_override, user, display_name="zone-refresh")
    await _create_zone(
        session_factory,
        name="Refresh Zone",
        short_name="refresh-zone",
        registration_points=100,
    )

    auth_override(user)
    register = await client.post("/api/v1/events/refresh-zone/registrations")
    assert register.status_code == 201
    original = register.json()
    decoded_original = jwt.decode(
        original["qrToken"],
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        options={"verify_exp": False},
    )

    async with session_factory() as session:
        registration = await session.get(ZoneRegistration, uuid.UUID(original["registrationId"]))
        registration.qr_expires_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=1)
        await session.commit()

    refreshed = await client.get(f"/api/v1/registrations/{original['registrationId']}/qr")
    assert refreshed.status_code == 200
    refreshed_body = refreshed.json()
    decoded_refreshed = jwt.decode(
        refreshed_body["qrToken"],
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
    assert refreshed_body["registrationId"] == original["registrationId"]
    assert refreshed_body["qrToken"] != original["qrToken"]
    assert decoded_refreshed["jti"] != decoded_original["jti"]


@pytest.mark.asyncio
async def test_admin_scan_check_in_is_atomic_and_duplicate_safe(
    client, auth_override, create_user, session_factory
):
    participant_user = await create_user(email="zones-scan@example.com", username="zonesscan")
    admin_user = await create_user(
        email="zones-admin@example.com",
        username="zonesadmin",
        role_name=ROLE_ADMIN,
    )
    participant_id = await _create_profile(
        client,
        auth_override,
        participant_user,
        display_name="zone-scan-player",
    )
    zone = await _create_zone(
        session_factory,
        name="Scan Zone",
        short_name="scan-zone",
        registration_points=0,
        check_in_points=50,
        points=0,
    )

    auth_override(participant_user)
    register = await client.post("/api/v1/events/scan-zone/registrations", json={})
    assert register.status_code == 201
    qr_token = register.json()["qrToken"]
    registration_id = register.json()["registrationId"]
    assert register.json()["pointsAwarded"] == 0
    assert register.json()["newPointsBalance"] == 0

    auth_override(admin_user)
    first = await client.post(
        "/api/v1/admin/scans/check-in",
        headers={"X-Idempotency-Key": "scan-idem-1"},
        json={
            "qrToken": qr_token,
            "scannerDeviceId": "gate-a-01",
            "scannedAt": "2026-04-18T11:24:33Z",
        },
    )
    assert first.status_code == 200
    assert first.json()["status"] == "checked_in"
    assert first.json()["participantId"] == str(participant_id)
    assert first.json()["eventId"] == "scan-zone"
    assert first.json()["eventName"] == "Scan Zone"
    assert first.json()["pointsAwarded"] == 50
    assert first.json()["newPointsBalance"] == 50
    check_in_id = first.json()["checkInId"]

    repeated_same_key = await client.post(
        "/api/v1/admin/scans/check-in",
        headers={"X-Idempotency-Key": "scan-idem-1"},
        json={
            "qrToken": qr_token,
            "scannerDeviceId": "gate-a-01",
            "scannedAt": "2026-04-18T11:24:33Z",
        },
    )
    assert repeated_same_key.status_code == 200
    assert repeated_same_key.json() == first.json()

    duplicate = await client.post(
        "/api/v1/admin/scans/check-in",
        headers={"X-Idempotency-Key": "scan-idem-2"},
        json={
            "qrToken": qr_token,
            "scannerDeviceId": "gate-a-01",
            "scannedAt": "2026-04-18T11:25:33Z",
        },
    )
    assert duplicate.status_code == 200
    assert duplicate.json()["status"] == "already_checked_in"
    assert duplicate.json()["checkInId"] == check_in_id
    assert duplicate.json()["pointsAwarded"] == 0
    assert duplicate.json()["newPointsBalance"] == 50

    invalid = await client.post(
        "/api/v1/admin/scans/check-in",
        headers={"X-Idempotency-Key": "scan-idem-3"},
        json={
            "qrToken": f"{qr_token}tampered",
            "scannerDeviceId": "gate-a-01",
            "scannedAt": "2026-04-18T11:26:33Z",
        },
    )
    assert invalid.status_code == 422
    assert invalid.json() == {
        "status": "invalid_qr",
        "checkInId": None,
        "participantId": None,
        "participantName": None,
        "eventId": None,
        "eventName": None,
        "pointsAwarded": None,
        "newPointsBalance": None,
        "checkedInAt": None,
        "message": None,
        "reason": "expired_or_tampered_or_not_registered",
    }

    idem_conflict = await client.post(
        "/api/v1/admin/scans/check-in",
        headers={"X-Idempotency-Key": "scan-idem-1"},
        json={
            "qrToken": qr_token,
            "scannerDeviceId": "gate-b-02",
            "scannedAt": "2026-04-18T11:24:33Z",
        },
    )
    assert idem_conflict.status_code == 409
    assert idem_conflict.json()["detail"] == "idempotency_key already exists for a different scan payload"

    auth_override(participant_user)
    me = await client.get("/api/v1/points/me")
    assert me.status_code == 200
    assert me.json()["balance"] == 50

    async with session_factory() as session:
        registrations = await session.exec(
            select(ZoneRegistration).where(ZoneRegistration.id == uuid.UUID(registration_id))
        )
        registration = registrations.one()
        assert registration.checked_in_at is not None


@pytest.mark.asyncio
async def test_zone_register_requires_participant_profile(client, auth_override, create_user, session_factory):
    user = await create_user(email="zones-noprofile@example.com", username="zonesnoprofile")
    auth_override(user)

    zone = await _create_zone(
        session_factory,
        name="Red Team",
        short_name="REDTEAM",
        registration_points=100,
    )
    register = await client.post(f"/api/v1/zones/{zone.id}/register")
    assert register.status_code == 404
    assert "Participant profile not found" in register.json()["detail"]


@pytest.mark.asyncio
async def test_me_passes_returns_checked_in_timestamp(client, auth_override, create_user, session_factory):
    user = await create_user(email="zones-pass-checkin@example.com", username="zonespasscheckin")
    participant_id = await _create_profile(
        client,
        auth_override,
        user,
        display_name="zone-pass-checkin",
    )

    zone = await _create_zone(session_factory, name="Blue Team", short_name="BLUETEAM")

    async with session_factory() as session:
        registration = ZoneRegistration(
            participant_id=participant_id,
            zone_id=zone.id,
            pass_code=f"code-{uuid4().hex}",
            qr_jti=uuid4().hex,
            qr_expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=12),
            is_active=True,
            checked_in_at=datetime.datetime.now(datetime.timezone.utc),
        )
        session.add(registration)
        await session.commit()

    auth_override(user)
    passes = await client.get("/api/v1/me/passes")
    assert passes.status_code == 200
    assert len(passes.json()["passes"]) == 1
    assert passes.json()["passes"][0]["checkedInAt"] is not None


@pytest.mark.asyncio
async def test_repeat_register_same_zone_keeps_single_active_registration(
    client, auth_override, create_user, session_factory
):
    user = await create_user(email="zones-race@example.com", username="zonesrace")
    await _create_profile(client, auth_override, user, display_name="zone-race")
    zone = await _create_zone(
        session_factory,
        name="Race Zone",
        short_name="RACEZONE",
        registration_points=100,
    )

    auth_override(user)
    r1 = await client.post(f"/api/v1/zones/{zone.id}/register")
    r2 = await client.post(f"/api/v1/zones/{zone.id}/register")
    assert r1.status_code == 201
    assert r2.status_code == 200

    regs = await client.get("/api/v1/me/registrations")
    assert regs.status_code == 200
    assert regs.json()["zoneIds"] == [str(zone.id)]

    points_me = await client.get("/api/v1/points/me")
    assert points_me.status_code == 200
    assert points_me.json()["balance"] == 100

    async with session_factory() as session:
        count_stmt = (
            select(col(ZoneRegistration.id))
            .where(ZoneRegistration.zone_id == zone.id)
            .where(ZoneRegistration.is_active.is_(True))
        )
        rows = await session.exec(count_stmt)
        assert len(list(rows.all())) == 1
