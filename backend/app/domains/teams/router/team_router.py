from fastapi import APIRouter, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.database import get_db
from app.domains.auth.models import ROLE_PARTICIPANT, User
from app.domains.teams.controller import create_team, join_team, my_team
from app.domains.teams.schemas import TeamCreate, TeamJoin, TeamRead
from app.utils.deps import require_roles

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("/", response_model=TeamRead, status_code=status.HTTP_201_CREATED)
async def create_team_route(
    payload: TeamCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(ROLE_PARTICIPANT)),
):
    return await create_team(db, user=user, payload=payload)


@router.post("/join", response_model=TeamRead)
async def join_team_route(
    payload: TeamJoin,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(ROLE_PARTICIPANT)),
):
    return await join_team(db, user=user, payload=payload)


@router.get("/me", response_model=TeamRead)
async def my_team_route(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(ROLE_PARTICIPANT)),
):
    return await my_team(db, user=user)
