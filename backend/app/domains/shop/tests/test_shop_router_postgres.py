import asyncio
import os
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession

import app.models  # noqa: F401
from app.core.security import create_access_token
from app.db.database import get_db
from app.db.post_commit import pop_post_commit_hooks
from app.domains.auth.models import ROLE_ADMIN, ROLE_PARTICIPANT, ROLE_PARTNER, Role, User
from app.main import app
from app.utils.deps import get_current_user

TEST_POSTGRES_DSN = os.getenv("TEST_POSTGRES_DSN")
pytestmark = pytest.mark.skipif(
    not TEST_POSTGRES_DSN,
    reason="Set TEST_POSTGRES_DSN to run Postgres-backed shop concurrency tests.",
)


def _redeem_payload(key: str) -> dict[str, str]:
    return {"idempotency_key": key}


def _return_payload(key: str) -> dict[str, str]:
    return {"idempotency_key": key}


def _set_auth_cookie(client: AsyncClient, user: User, role_name: str) -> None:
    token = create_access_token(user.id, role_name)
    client.cookies.set("access_token", token)


@pytest_asyncio.fixture
async def pg_session_factory():
    engine = create_async_engine(TEST_POSTGRES_DSN)
    async with engine.begin() as conn:
        await conn.exec_driver_sql("DROP SCHEMA IF EXISTS public CASCADE")
        await conn.exec_driver_sql("CREATE SCHEMA public")
        await conn.run_sync(SQLModel.metadata.create_all)
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
async def test_postgres_concurrent_same_return_idempotency_is_single_refund(
    pg_client, pg_create_user
):
    admin = await pg_create_user(email="pg-shop-return-admin@example.com", username="pgshopreturnadmin", role_name=ROLE_ADMIN)
    player = await pg_create_user(email="pg-shop-return@example.com", username="pgshopreturn")

    _set_auth_cookie(pg_client, player, ROLE_PARTICIPANT)
    profile = await pg_client.post(
        "/api/v1/participants/me",
        json={"display_name": "pg-shop-return", "institution": "VIT-AP", "year": 2},
    )
    assert profile.status_code == 201
    participant_id = profile.json()["id"]

    _set_auth_cookie(pg_client, admin, ROLE_ADMIN)
    seed = await pg_client.post(
        "/api/v1/points/award",
        json={
            "participant_id": participant_id,
            "amount": 150,
            "reason": "zone.lock_hunt.complete",
            "idempotency_key": str(uuid.uuid4()),
        },
    )
    assert seed.status_code == 201

    create_item = await pg_client.post(
        "/api/v1/shop/",
        json={"name": "PG Return Item", "description": "same-key", "point_cost": 90, "stock": 1},
    )
    assert create_item.status_code == 201
    item_id = create_item.json()["id"]

    _set_auth_cookie(pg_client, player, ROLE_PARTICIPANT)
    redeem = await pg_client.post(
        f"/api/v1/shop/{item_id}/redeem",
        json=_redeem_payload("pg-return-redeem-1"),
    )
    assert redeem.status_code == 200
    redemption_id = redeem.json()["id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://testserver", follow_redirects=True
    ) as client_a, AsyncClient(
        transport=transport, base_url="http://testserver", follow_redirects=True
    ) as client_b:
        _set_auth_cookie(client_a, admin, ROLE_ADMIN)
        _set_auth_cookie(client_b, admin, ROLE_ADMIN)
        r1, r2 = await asyncio.gather(
            client_a.patch(
                f"/api/v1/shop/redemptions/{redemption_id}/return",
                json=_return_payload("pg-return-idem-1"),
            ),
            client_b.patch(
                f"/api/v1/shop/redemptions/{redemption_id}/return",
                json=_return_payload("pg-return-idem-1"),
            ),
        )

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["id"] == r2.json()["id"]

    _set_auth_cookie(pg_client, player, ROLE_PARTICIPANT)
    points_me = await pg_client.get("/api/v1/points/me")
    assert points_me.status_code == 200
    assert points_me.json()["balance"] == 150
    return_entries = [
        entry
        for entry in points_me.json()["recent_transactions"]
        if entry["reason"].startswith("shop.return.")
    ]
    assert len(return_entries) == 1


@pytest.mark.asyncio
async def test_postgres_concurrent_different_return_keys_only_one_wins(
    pg_client, pg_create_user
):
    admin = await pg_create_user(email="pg-shop-return-conf-admin@example.com", username="pgshopreturnconfadmin", role_name=ROLE_ADMIN)
    player = await pg_create_user(email="pg-shop-return-conf@example.com", username="pgshopreturnconf")

    _set_auth_cookie(pg_client, player, ROLE_PARTICIPANT)
    profile = await pg_client.post(
        "/api/v1/participants/me",
        json={"display_name": "pg-shop-return-conf", "institution": "VIT-AP", "year": 2},
    )
    assert profile.status_code == 201
    participant_id = profile.json()["id"]

    _set_auth_cookie(pg_client, admin, ROLE_ADMIN)
    seed = await pg_client.post(
        "/api/v1/points/award",
        json={
            "participant_id": participant_id,
            "amount": 200,
            "reason": "zone.lock_hunt.complete",
            "idempotency_key": str(uuid.uuid4()),
        },
    )
    assert seed.status_code == 201

    create_item = await pg_client.post(
        "/api/v1/shop/",
        json={"name": "PG Return Conflict", "description": "diff-key", "point_cost": 75, "stock": 1},
    )
    assert create_item.status_code == 201
    item_id = create_item.json()["id"]

    _set_auth_cookie(pg_client, player, ROLE_PARTICIPANT)
    redeem = await pg_client.post(
        f"/api/v1/shop/{item_id}/redeem",
        json=_redeem_payload("pg-return-redeem-2"),
    )
    assert redeem.status_code == 200
    redemption_id = redeem.json()["id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://testserver", follow_redirects=True
    ) as client_a, AsyncClient(
        transport=transport, base_url="http://testserver", follow_redirects=True
    ) as client_b:
        _set_auth_cookie(client_a, admin, ROLE_ADMIN)
        _set_auth_cookie(client_b, admin, ROLE_ADMIN)
        r1, r2 = await asyncio.gather(
            client_a.patch(
                f"/api/v1/shop/redemptions/{redemption_id}/return",
                json=_return_payload("pg-return-conflict-1"),
            ),
            client_b.patch(
                f"/api/v1/shop/redemptions/{redemption_id}/return",
                json=_return_payload("pg-return-conflict-2"),
            ),
        )

    assert sorted([r1.status_code, r2.status_code]) == [200, 409]

    _set_auth_cookie(pg_client, player, ROLE_PARTICIPANT)
    points_me = await pg_client.get("/api/v1/points/me")
    assert points_me.status_code == 200
    assert points_me.json()["balance"] == 200
    return_entries = [
        entry
        for entry in points_me.json()["recent_transactions"]
        if entry["reason"].startswith("shop.return.")
    ]
    assert len(return_entries) == 1
