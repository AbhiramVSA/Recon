import uuid

from fastapi import APIRouter, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.database import get_db
from app.domains.auth.models import ROLE_ADMIN, ROLE_PARTICIPANT, User
from app.domains.teams.controller import (
    admin_create_team,
    admin_delete_team,
    admin_get_team,
    admin_list_teams,
    admin_set_participant_team,
    admin_update_team,
    create_team,
    join_team,
    my_team,
)
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
    user: User = Depends(require_roles(ROLE_PARTICIPANT, ROLE_ADMIN)),
):
    return await my_team(db, user=user)


@router.get("/admin", response_model=TeamListRead)
async def admin_list_teams_route(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(ROLE_ADMIN)),
):
    return await admin_list_teams(db)


@router.post("/admin", response_model=TeamRead, status_code=status.HTTP_201_CREATED)
async def admin_create_team_route(
    payload: TeamAdminCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(ROLE_ADMIN)),
):
    return await admin_create_team(db, payload=payload)


@router.get("/admin/{team_id}", response_model=TeamRead)
async def admin_get_team_route(
    team_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(ROLE_ADMIN)),
):
    return await admin_get_team(db, team_id=team_id)


@router.patch("/admin/{team_id}", response_model=TeamRead)
async def admin_update_team_route(
    team_id: uuid.UUID,
    payload: TeamAdminUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(ROLE_ADMIN)),
):
    return await admin_update_team(db, team_id=team_id, payload=payload)


@router.delete("/admin/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_team_route(
    team_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(ROLE_ADMIN)),
):
    await admin_delete_team(db, team_id=team_id)


@router.put(
    "/admin/participants/{participant_id}/team",
    response_model=TeamAssignmentRead,
)
async def admin_set_participant_team_route(
    participant_id: uuid.UUID,
    payload: TeamMembershipAdminUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(ROLE_ADMIN)),
):
    return await admin_set_participant_team(
        db,
        participant_id=participant_id,
        payload=payload,
    )
