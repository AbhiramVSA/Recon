import asyncio
import os
from pathlib import Path
import uuid

import jwt
import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

import app.models  # noqa: F401
from app.core.config import ModeEnum, settings
from app.core.security import create_access_token
from app.db.database import get_db
from app.db.post_commit import pop_post_commit_hooks
from app.domains.auth.models import ROLE_ADMIN, ROLE_PARTICIPANT, ROLE_PARTNER, Role, User
from app.domains.points.models import PointLedger
from app.domains.zones.models import Zone, ZoneCheckIn
from app.domains.zones.service import zone_service
from app.main import app
from app.utils.deps import get_current_user

TEST_POSTGRES_DSN = os.getenv("TEST_POSTGRES_DSN")
pytestmark = pytest.mark.skipif(
    not TEST_POSTGRES_DSN,
    reason="Set TEST_POSTGRES_DSN to run Postgres-backed zones concurrency tests.",
)
ALEMBIC_INI_PATH = Path(__file__).resolve().parents[4] / "alembic.ini"
ALEMBIC_SCRIPT_PATH = Path(__file__).resolve().parents[4] / "alembic"


def _set_auth_cookie(client: AsyncClient, user: User, role_name: str) -> None:
    token = create_access_token(user.id, role_name)
    client.cookies.set("access_token", token)


@pytest_asyncio.fixture
async def pg_session_factory():
    engine = create_async_engine(TEST_POSTGRES_DSN)
    async with engine.begin() as conn:
        await conn.exec_driver_sql("DROP SCHEMA IF EXISTS public CASCADE")
        await conn.exec_driver_sql("CREATE SCHEMA public")
    previous_database_uri = settings.ASYNC_DATABASE_URI
    previous_mode = settings.MODE
    settings.ASYNC_DATABASE_URI = TEST_POSTGRES_DSN
    settings.MODE = ModeEnum.development
    alembic_config = Config(str(ALEMBIC_INI_PATH))
    alembic_config.set_main_option("script_location", str(ALEMBIC_SCRIPT_PATH))
    try:
        await asyncio.to_thread(command.upgrade, alembic_config, "head")
    finally:
        settings.ASYNC_DATABASE_URI = previous_database_uri
        settings.MODE = previous_mode
    factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )
    try:
        yield factory
    finally:
        await engine.dispose()


@pytest_asyncio.fixture
async def pg_client(pg_session_factory):
    async def override_get_db():
        async with pg_session_factory() as session:
            try:
                yield session
                await session.commit()
                hooks = pop_post_commit_hooks(session)
                for hook in hooks:
                    await hook()
            except Exception:
                pop_post_commit_hooks(session)
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", follow_redirects=True) as client:
        yield client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def pg_seeded_roles(pg_session_factory):
    async with pg_session_factory() as session:
        session.add_all(
            [
                Role(name=ROLE_ADMIN, description="Admin"),
                Role(name=ROLE_PARTICIPANT, description="Participant"),
                Role(name=ROLE_PARTNER, description="Partner"),
            ]
        )
        await session.commit()


@pytest_asyncio.fixture
async def pg_create_user(pg_session_factory, pg_seeded_roles):
    async def _create(*, email: str, username: str, role_name: str = ROLE_PARTICIPANT) -> User:
        async with pg_session_factory() as session:
            role = (await session.exec(select(Role).where(Role.name == role_name))).one()
            user = User(email=email, username=username, role_id=role.id)
            user.role = role
            session.add(user)
            await session.commit()
            await session.refresh(user)
            user.role = role
            return user

    return _create


@pytest.fixture
def pg_auth_override():
    original = app.dependency_overrides.get(get_current_user)

    def _set(user: User):
        async def override() -> User:
            return user

        app.dependency_overrides[get_current_user] = override

    yield _set
    if original is not None:
        app.dependency_overrides[get_current_user] = original
    else:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_postgres_concurrent_zone_scans_with_different_keys_award_once(
    pg_client, pg_create_user, pg_session_factory
):
    admin = await pg_create_user(email="pg-zone-admin@example.com", username="pgzoneadmin", role_name=ROLE_ADMIN)
    player = await pg_create_user(email="pg-zone-player@example.com", username="pgzoneplayer")

    _set_auth_cookie(pg_client, player, ROLE_PARTICIPANT)
    profile = await pg_client.post(
        "/api/v1/participants/me",
        json={"display_name": "pg-zone-scan", "institution": "VIT-AP", "year": 2},
    )
    assert profile.status_code == 201
    participant_id = profile.json()["id"]

    async with pg_session_factory() as session:
        zone = Zone(
            name="PG AppSec",
            short_name="appsec",
            category="challenge",
            zone_type="booth",
            status="green",
            location="Hall PG",
            points=35,
            color="#22C55E",
            tags=["pg"],
            is_active=True,
        )
        session.add(zone)
        await session.commit()

    register = await pg_client.post("/api/v1/events/appsec/registrations", json={})
    assert register.status_code == 201
    qr_token = register.json()["qrToken"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://testserver", follow_redirects=True
    ) as client_a, AsyncClient(
        transport=transport, base_url="http://testserver", follow_redirects=True
    ) as client_b:
        _set_auth_cookie(client_a, admin, ROLE_ADMIN)
        _set_auth_cookie(client_b, admin, ROLE_ADMIN)
        r1, r2 = await asyncio.gather(
            client_a.post(
                "/api/v1/admin/scans/check-in",
                headers={"X-Idempotency-Key": str(uuid.uuid4())},
                json={
                    "qrToken": qr_token,
                    "scannerDeviceId": "gate-a-01",
                    "scannedAt": "2026-04-18T11:24:33Z",
                },
            ),
            client_b.post(
                "/api/v1/admin/scans/check-in",
                headers={"X-Idempotency-Key": str(uuid.uuid4())},
                json={
                    "qrToken": qr_token,
                    "scannerDeviceId": "gate-b-02",
                    "scannedAt": "2026-04-18T11:24:34Z",
                },
            ),
        )

    statuses = sorted([r1.json()["status"], r2.json()["status"]])
    assert statuses == ["already_checked_in", "checked_in"]

    _set_auth_cookie(pg_client, player, ROLE_PARTICIPANT)
    me = await pg_client.get("/api/v1/points/me")
    assert me.status_code == 200
    assert me.json()["participant_id"] == participant_id
    assert me.json()["balance"] == 35

    async with pg_session_factory() as session:
        rows = await session.exec(select(ZoneCheckIn))
        assert len(list(rows.all())) == 1


@pytest.mark.asyncio
async def test_postgres_concurrent_zone_scans_same_idempotency_return_same_response(
    pg_client, pg_create_user, pg_session_factory, monkeypatch
):
    admin = await pg_create_user(email="pg-zone-admin-idem@example.com", username="pgzoneadminidem", role_name=ROLE_ADMIN)
    player = await pg_create_user(email="pg-zone-player-idem@example.com", username="pgzoneplayeridem")

    _set_auth_cookie(pg_client, player, ROLE_PARTICIPANT)
    profile = await pg_client.post(
        "/api/v1/participants/me",
        json={"display_name": "pg-zone-same-idem", "institution": "VIT-AP", "year": 2},
    )
    assert profile.status_code == 201

    async with pg_session_factory() as session:
        zone = Zone(
            name="PG Same Idem",
            short_name="same-idem",
            category="challenge",
            zone_type="booth",
            status="green",
            location="Hall PG",
            points=20,
            color="#22C55E",
            tags=["pg"],
            is_active=True,
        )
        session.add(zone)
        await session.commit()

    register = await pg_client.post("/api/v1/events/same-idem/registrations", json={})
    assert register.status_code == 201
    qr_token = register.json()["qrToken"]
    decoded = jwt.decode(
        qr_token,
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
    assert decoded["eventId"] == "same-idem"

    idem_key = str(uuid.uuid4())
    payload = {
        "qrToken": qr_token,
        "scannerDeviceId": "gate-a-01",
        "scannedAt": "2026-04-18T11:24:33Z",
    }

    original_complete_scan_request = zone_service.crud.complete_scan_request
    delayed_once = False

    async def delayed_complete_scan_request(*args, **kwargs):
        nonlocal delayed_once
        if not delayed_once:
            delayed_once = True
            await asyncio.sleep(0.2)
        return await original_complete_scan_request(*args, **kwargs)

    monkeypatch.setattr(
        zone_service.crud,
        "complete_scan_request",
        delayed_complete_scan_request,
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://testserver", follow_redirects=True
    ) as client_a, AsyncClient(
        transport=transport, base_url="http://testserver", follow_redirects=True
    ) as client_b:
        _set_auth_cookie(client_a, admin, ROLE_ADMIN)
        _set_auth_cookie(client_b, admin, ROLE_ADMIN)
        r1, r2 = await asyncio.gather(
            client_a.post(
                "/api/v1/admin/scans/check-in",
                headers={"X-Idempotency-Key": idem_key},
                json=payload,
            ),
            client_b.post(
                "/api/v1/admin/scans/check-in",
                headers={"X-Idempotency-Key": idem_key},
                json=payload,
            ),
        )

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["status"] == "checked_in"
    assert r2.json()["status"] == "checked_in"
    assert r1.json()["checkInId"] == r2.json()["checkInId"]


@pytest.mark.asyncio
async def test_postgres_zone_check_in_partial_unique_index_blocks_duplicate_ledger_rows(
    pg_client, pg_create_user, pg_session_factory
):
    player = await pg_create_user(email="pg-zone-ledger@example.com", username="pgzoneledger")

    _set_auth_cookie(pg_client, player, ROLE_PARTICIPANT)
    profile = await pg_client.post(
        "/api/v1/participants/me",
        json={"display_name": "pg-zone-ledger", "institution": "VIT-AP", "year": 2},
    )
    assert profile.status_code == 201
    participant_id = uuid.UUID(profile.json()["id"])

    async with pg_session_factory() as session:
        zone = Zone(
            name="PG Ledger Zone",
            short_name="pg-ledger",
            category="challenge",
            zone_type="booth",
            status="green",
            location="Hall PG",
            points=15,
            color="#22C55E",
            tags=["pg"],
            is_active=True,
        )
        session.add(zone)
        await session.commit()

    register = await pg_client.post("/api/v1/events/pg-ledger/registrations", json={})
    assert register.status_code == 201
    registration_id = uuid.UUID(register.json()["registrationId"])

    async with pg_session_factory() as session:
        first_entry = PointLedger(
            participant_id=participant_id,
            amount=15,
            reason="zone.event_check_in",
            reference_id=registration_id,
            idempotency_key=str(uuid.uuid4()),
            note="first zone check-in",
            resulting_balance=15,
        )
        session.add(first_entry)
        await session.commit()

        duplicate_entry = PointLedger(
            participant_id=participant_id,
            amount=15,
            reason="zone.event_check_in",
            reference_id=registration_id,
            idempotency_key=str(uuid.uuid4()),
            note="duplicate zone check-in",
            resulting_balance=30,
        )
        session.add(duplicate_entry)
        with pytest.raises(IntegrityError):
            await session.commit()
        await session.rollback()
