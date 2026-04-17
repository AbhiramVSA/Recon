import uuid

from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.database import get_db
from app.domains.auth.models import ROLE_ADMIN, ROLE_PARTICIPANT, User
from app.domains.treasure_hunt.controller import (
    finishers,
    leaderboard,
    my_progress,
    scan_problem,
    submit_problem_flag,
)
from app.domains.treasure_hunt.schemas import (
    TreasureHuntFlagSubmit,
    TreasureHuntFlagSubmitRead,
    TreasureHuntLeaderboardRead,
    TreasureHuntProblemRead,
    TreasureHuntTeamProgressRead,
)
from app.utils.deps import require_roles

router = APIRouter(prefix="/treasure-hunt", tags=["treasure-hunt"])


@router.get("/scan/{qr_token}", response_model=TreasureHuntProblemRead)
async def scan_problem_route(
    qr_token: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(ROLE_PARTICIPANT)),
):
    return await scan_problem(db, user=user, qr_token=qr_token)


@router.post("/problems/{problem_id}/submit", response_model=TreasureHuntFlagSubmitRead)
async def submit_problem_flag_route(
    problem_id: uuid.UUID,
    payload: TreasureHuntFlagSubmit,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(ROLE_PARTICIPANT)),
):
    return await submit_problem_flag(db, user=user, problem_id=problem_id, payload=payload)


@router.get("/me/progress", response_model=TreasureHuntTeamProgressRead)
async def my_progress_route(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(ROLE_PARTICIPANT)),
):
    return await my_progress(db, user=user)


@router.get("/leaderboard", response_model=TreasureHuntLeaderboardRead)
async def leaderboard_route(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(ROLE_PARTICIPANT, ROLE_ADMIN)),
):
    return await leaderboard(db, skip=skip, limit=limit)


@router.get("/finishers", response_model=TreasureHuntLeaderboardRead)
async def finishers_route(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(ROLE_PARTICIPANT, ROLE_ADMIN)),
):
    return await finishers(db)
