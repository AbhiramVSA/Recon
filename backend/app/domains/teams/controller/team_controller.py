from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.auth.models import User
from app.domains.teams.schemas import TeamCreate, TeamJoin, TeamRead
from app.domains.teams.service import create_team_for_user, get_my_team, join_team_for_user


async def create_team(db: AsyncSession, *, user: User, payload: TeamCreate) -> TeamRead:
    return await create_team_for_user(db, user=user, payload=payload)


async def join_team(db: AsyncSession, *, user: User, payload: TeamJoin) -> TeamRead:
    return await join_team_for_user(db, user=user, payload=payload)


async def my_team(db: AsyncSession, *, user: User) -> TeamRead:
    return await get_my_team(db, user=user)
