import uuid

from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.auth.models import User
from app.domains.teams.schemas import (
    TeamAdminCreate,
    TeamAdminUpdate,
    TeamAssignmentRead,
    TeamCreate,
    TeamJoin,
    TeamListRead,
    TeamMembershipAdminUpdate,
    TeamRead,
)
from app.domains.teams.service import (
    create_team_for_admin,
    create_team_for_user,
    delete_team_for_admin,
    get_my_team,
    get_team_for_admin,
    join_team_for_user,
    list_teams_for_admin,
    set_participant_team_for_admin,
    update_team_for_admin,
)


async def create_team(db: AsyncSession, *, user: User, payload: TeamCreate) -> TeamRead:
    return await create_team_for_user(db, user=user, payload=payload)


async def join_team(db: AsyncSession, *, user: User, payload: TeamJoin) -> TeamRead:
    return await join_team_for_user(db, user=user, payload=payload)


async def my_team(db: AsyncSession, *, user: User) -> TeamRead:
    return await get_my_team(db, user=user)


async def admin_list_teams(db: AsyncSession) -> TeamListRead:
    return await list_teams_for_admin(db)


async def admin_get_team(db: AsyncSession, *, team_id: uuid.UUID) -> TeamRead:
    return await get_team_for_admin(db, team_id=team_id)


async def admin_create_team(
    db: AsyncSession, *, payload: TeamAdminCreate
) -> TeamRead:
    return await create_team_for_admin(db, payload=payload)


async def admin_update_team(
    db: AsyncSession, *, team_id: uuid.UUID, payload: TeamAdminUpdate
) -> TeamRead:
    return await update_team_for_admin(db, team_id=team_id, payload=payload)


async def admin_delete_team(db: AsyncSession, *, team_id: uuid.UUID) -> None:
    await delete_team_for_admin(db, team_id=team_id)


async def admin_set_participant_team(
    db: AsyncSession,
    *,
    participant_id: uuid.UUID,
    payload: TeamMembershipAdminUpdate,
) -> TeamAssignmentRead:
    return await set_participant_team_for_admin(
        db,
        participant_id=participant_id,
        target_team_id=payload.target_team_id,
    )
