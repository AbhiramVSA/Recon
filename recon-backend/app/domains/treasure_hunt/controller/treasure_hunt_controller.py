import uuid

from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.auth.models import User
from app.domains.treasure_hunt.schemas import (
    TreasureHuntFlagSubmit,
    TreasureHuntFlagSubmitRead,
    TreasureHuntLeaderboardRead,
    TreasureHuntProblemRead,
    TreasureHuntTeamProgressRead,
)
from app.domains.treasure_hunt.service import (
    get_finishers,
    get_leaderboard,
    get_my_progress,
    reveal_problem,
    submit_flag,
)


async def scan_problem(
    db: AsyncSession, *, user: User, qr_token: str
) -> TreasureHuntProblemRead:
    return await reveal_problem(db, user=user, qr_token=qr_token)


async def submit_problem_flag(
    db: AsyncSession,
    *,
    user: User,
    problem_id: uuid.UUID,
    payload: TreasureHuntFlagSubmit,
) -> TreasureHuntFlagSubmitRead:
    return await submit_flag(db, user=user, problem_id=problem_id, payload=payload)


async def my_progress(db: AsyncSession, *, user: User) -> TreasureHuntTeamProgressRead:
    return await get_my_progress(db, user=user)


async def leaderboard(
    db: AsyncSession, *, skip: int, limit: int
) -> TreasureHuntLeaderboardRead:
    return await get_leaderboard(db, skip=skip, limit=limit)


async def finishers(db: AsyncSession) -> TreasureHuntLeaderboardRead:
    return await get_finishers(db)
