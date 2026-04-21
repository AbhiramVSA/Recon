import os
import uuid

import httpx
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from sqlmodel import delete, select
from sqlmodel.ext.asyncio.session import AsyncSession as SQLModelAsyncSession

from app.core.config import settings
from app.core.security import create_access_token
from app.domains.auth.models import ROLE_PARTICIPANT, Role, User
from app.domains.participants.models import Participant
from app.domains.teams.models import Team, TeamMembership
from app.domains.treasure_hunt.models import TreasureHuntProblem
from app.domains.treasure_hunt.models import TreasureHuntSolve, TreasureHuntTeamProgress

RUN_LIVE_TESTS = os.getenv("RUN_LIVE_TESTS") == "1"
BASE_URL = os.getenv("LIVE_BASE_URL", "http://127.0.0.1:8000")
API_PREFIX = "/api/v1"

pytestmark = pytest.mark.skipif(
    not RUN_LIVE_TESTS,
    reason="Set RUN_LIVE_TESTS=1 to execute live-server treasure hunt tests.",
)

FLAG_BY_SLUG = {
    "dancing-men": "ELEMENTARY MY DEAR WATSON",
    "unown-pokemon-alphabet": "THE DARK KNIGHT ALWAYS RISES",
}


@pytest_asyncio.fixture
async def live_client() -> httpx.AsyncClient:
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        yield client


@pytest_asyncio.fixture
async def db_session_factory():
    engine = create_async_engine(
        str(settings.ASYNC_DATABASE_URI),
        poolclass=NullPool,
    )
    factory = async_sessionmaker(
        engine,
        class_=SQLModelAsyncSession,
        expire_on_commit=False,
    )
    try:
        yield factory
    finally:
        await engine.dispose()


async def _ensure_role(session_factory, name: str) -> Role:
    async with session_factory() as session:
        result = await session.exec(select(Role).where(Role.name == name))
        role = result.one_or_none()
        if role is not None:
            return role
        role = Role(name=name, description=f"auto-created for live tests: {name}")
        session.add(role)
        await session.commit()
        await session.refresh(role)
        return role


async def _create_user(session_factory, *, suffix: str) -> User:
    role = await _ensure_role(session_factory, ROLE_PARTICIPANT)
    async with session_factory() as session:
        user = User(
            email=f"live-hunt-{suffix}@example.com",
            username=f"live_hunt_{suffix}",
            role_id=role.id,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


async def _create_participant_for_user(session_factory, user: User, *, suffix: str) -> Participant:
    async with session_factory() as session:
        participant = Participant(
            user_id=user.id,
            display_name=f"live-hunt-{suffix}",
            institution="VIT-AP",
            year=2,
        )
        session.add(participant)
        await session.commit()
        await session.refresh(participant)
        return participant


async def _get_problem_id(session_factory, *, slug: str) -> uuid.UUID:
    async with session_factory() as session:
        result = await session.exec(select(TreasureHuntProblem).where(TreasureHuntProblem.slug == slug))
        problem = result.one()
        return problem.id


def _set_auth_cookie(client: httpx.AsyncClient, user: User) -> None:
    token = create_access_token(user.id, ROLE_PARTICIPANT)
    client.cookies.set("access_token", token)


async def _cleanup_user_graph(session_factory, *, user_id: uuid.UUID) -> None:
    async with session_factory() as session:
        participant_result = await session.exec(
            select(Participant).where(Participant.user_id == user_id)
        )
        participant = participant_result.one_or_none()

        team_id = None
        if participant is not None:
            membership_result = await session.exec(
                select(TeamMembership).where(TeamMembership.participant_id == participant.id)
            )
            membership = membership_result.one_or_none()
            if membership is not None:
                team_id = membership.team_id

        if team_id is not None:
            await session.exec(
                delete(TreasureHuntSolve).where(TreasureHuntSolve.team_id == team_id)
            )
            await session.exec(
                delete(TreasureHuntTeamProgress).where(TreasureHuntTeamProgress.team_id == team_id)
            )
            await session.exec(
                delete(TeamMembership).where(TeamMembership.team_id == team_id)
            )
            await session.exec(delete(Team).where(Team.id == team_id))

        if participant is not None:
            await session.exec(delete(Participant).where(Participant.id == participant.id))

        await session.exec(delete(User).where(User.id == user_id))
        await session.commit()


@pytest.mark.asyncio
async def test_live_treasure_hunt_team_scan_submit_and_progress(
    live_client: httpx.AsyncClient, db_session_factory
):
    suffix = uuid.uuid4().hex[:8]
    user = await _create_user(db_session_factory, suffix=suffix)
    try:
        await _create_participant_for_user(db_session_factory, user, suffix=suffix)
        _set_auth_cookie(live_client, user)

        created_team = await live_client.post(f"{API_PREFIX}/teams/", json={"name": f"Live Hunt {suffix}"})
        assert created_team.status_code == 201

        scanned = await live_client.get(f"{API_PREFIX}/treasure-hunt/scan/th-01-dancing-men")
        assert scanned.status_code == 200
        assert scanned.json()["slug"] == "dancing-men"

        problem_id = await _get_problem_id(db_session_factory, slug="dancing-men")
        solved = await live_client.post(
            f"{API_PREFIX}/treasure-hunt/problems/{problem_id}/submit",
            json={"flag": FLAG_BY_SLUG["dancing-men"], "idempotency_key": f"live-hunt-solve-{suffix}"},
        )
        assert solved.status_code == 200
        assert solved.json()["status"] == "solved"

        progress = await live_client.get(f"{API_PREFIX}/treasure-hunt/me/progress")
        assert progress.status_code == 200
        assert progress.json()["solved_count"] >= 1
        assert any(item["slug"] == "dancing-men" and item["solved"] for item in progress.json()["problems"])
    finally:
        await _cleanup_user_graph(db_session_factory, user_id=user.id)


@pytest.mark.asyncio
async def test_live_treasure_hunt_idempotency_conflict_between_problems(
    live_client: httpx.AsyncClient, db_session_factory
):
    suffix = uuid.uuid4().hex[:8]
    user = await _create_user(db_session_factory, suffix=f"conflict-{suffix}")
    try:
        await _create_participant_for_user(db_session_factory, user, suffix=f"conflict-{suffix}")
        _set_auth_cookie(live_client, user)

        team = await live_client.post(f"{API_PREFIX}/teams/", json={"name": f"Live Hunt Conflict {suffix}"})
        assert team.status_code == 201

        first_problem_id = await _get_problem_id(db_session_factory, slug="dancing-men")
        second_problem_id = await _get_problem_id(db_session_factory, slug="unown-pokemon-alphabet")
        idem = f"live-hunt-idem-{suffix}"

        first = await live_client.post(
            f"{API_PREFIX}/treasure-hunt/problems/{first_problem_id}/submit",
            json={"flag": FLAG_BY_SLUG["dancing-men"], "idempotency_key": idem},
        )
        second = await live_client.post(
            f"{API_PREFIX}/treasure-hunt/problems/{second_problem_id}/submit",
            json={"flag": FLAG_BY_SLUG["unown-pokemon-alphabet"], "idempotency_key": idem},
        )

        assert first.status_code == 200
        assert second.status_code == 409
    finally:
        await _cleanup_user_graph(db_session_factory, user_id=user.id)
