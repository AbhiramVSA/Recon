import secrets
import uuid

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.auth.models import User
from app.domains.participants.crud import (
    get_participant_by_id,
    get_participant_by_user_id,
)
from app.domains.participants.models import Participant
from app.domains.points import crud as points_crud
from app.domains.teams import crud
from app.domains.teams.models import Team, TeamMembership
from app.domains.teams.schemas import (
    TeamAdminCreate,
    TeamAdminUpdate,
    TeamAssignmentRead,
    TeamCreate,
    TeamJoin,
    TeamListRead,
    TeamMemberRead,
    TeamRead,
)

INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
INVITE_CODE_LENGTH = 6


async def create_team_for_user(
    db: AsyncSession, *, user: User, payload: TeamCreate
) -> TeamRead:
    participant = await _require_participant(db, user)
    await _ensure_self_service_available(participant)
    await _ensure_not_in_team(db, participant_id=participant.id)

    if await crud.get_team_by_name(db, name=payload.name):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Team name already exists")

    async with db.begin_nested():
        team = await crud.create_team(
            db,
            name=payload.name,
            invite_code=await _generate_invite_code(db),
            created_by_participant_id=participant.id,
        )
        await crud.create_membership(db, team_id=team.id, participant_id=participant.id)
    participant.team_self_service_locked = True
    await db.flush()
    return await _build_team_read(db, team)


async def join_team_for_user(db: AsyncSession, *, user: User, payload: TeamJoin) -> TeamRead:
    participant = await _require_participant(db, user)
    await _ensure_self_service_available(participant)
    await _ensure_not_in_team(db, participant_id=participant.id)

    team = await crud.get_team_by_invite_code(db, invite_code=payload.invite_code)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    try:
        async with db.begin_nested():
            await crud.create_membership(db, team_id=team.id, participant_id=participant.id)
    except IntegrityError:
        existing = await crud.get_membership_by_participant_id(db, participant_id=participant.id)
        if existing and existing.team_id == team.id:
            participant.team_self_service_locked = True
            await db.flush()
            return await _build_team_read(db, team)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Participant is already in a team",
        )
    participant.team_self_service_locked = True
    await db.flush()
    return await _build_team_read(db, team)


async def get_my_team(db: AsyncSession, *, user: User) -> TeamRead:
    participant = await _require_participant(db, user)
    team, _ = await get_team_for_participant_id(db, participant_id=participant.id)
    return await _build_team_read(db, team)


async def list_teams_for_admin(db: AsyncSession) -> TeamListRead:
    teams = await crud.list_teams(db)
    return TeamListRead(teams=[await _build_team_read(db, team) for team in teams])


async def get_team_for_admin(db: AsyncSession, *, team_id: uuid.UUID) -> TeamRead:
    team = await _require_team(db, team_id=team_id)
    return await _build_team_read(db, team)


async def create_team_for_admin(
    db: AsyncSession, *, payload: TeamAdminCreate
) -> TeamRead:
    if await crud.get_team_by_name(db, name=payload.name):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Team name already exists")

    creator = None
    if payload.created_by_participant_id is not None:
        creator = await get_participant_by_id(db, payload.created_by_participant_id)
        if not creator:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="created_by_participant_id participant not found",
            )

    team = await crud.create_team(
        db,
        name=payload.name,
        invite_code=await _generate_invite_code(db),
        created_by_participant_id=creator.id if creator else None,
    )
    for participant_id in list(dict.fromkeys(payload.member_participant_ids)):
        await _set_participant_team(db, participant_id=participant_id, target_team_id=team.id)
    return await _build_team_read(db, team)


async def update_team_for_admin(
    db: AsyncSession, *, team_id: uuid.UUID, payload: TeamAdminUpdate
) -> TeamRead:
    team = await _require_team(db, team_id=team_id)
    if payload.name is not None and payload.name != team.name:
        existing = await crud.get_team_by_name(db, name=payload.name)
        if existing and existing.id != team.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Team name already exists")
        team.name = payload.name
    if payload.regenerate_invite_code:
        team.invite_code = await _generate_invite_code(db)
    elif payload.invite_code is not None and payload.invite_code != team.invite_code:
        existing_code_team = await crud.get_team_by_invite_code(db, invite_code=payload.invite_code)
        if existing_code_team and existing_code_team.id != team.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invite code already exists")
        team.invite_code = payload.invite_code
    if payload.created_by_participant_id is not None:
        creator = await get_participant_by_id(db, payload.created_by_participant_id)
        if not creator:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="created_by_participant_id participant not found",
            )
        team.created_by_participant_id = creator.id
    team = await crud.save_team(db, team=team)
    return await _build_team_read(db, team)


async def delete_team_for_admin(db: AsyncSession, *, team_id: uuid.UUID) -> None:
    team = await _require_team(db, team_id=team_id)
    if await points_crud.team_has_competition_activity(db, team_id=team.id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Team has competition history and cannot be deleted",
        )
    memberships = await crud.list_memberships_by_team_id(db, team_id=team.id)
    for membership in memberships:
        await crud.delete_membership(db, membership=membership)
    await crud.delete_team(db, team=team)


async def set_participant_team_for_admin(
    db: AsyncSession, *, participant_id: uuid.UUID, target_team_id: uuid.UUID | None
) -> TeamAssignmentRead:
    return await _set_participant_team(
        db, participant_id=participant_id, target_team_id=target_team_id
    )


async def get_team_for_participant_id(
    db: AsyncSession, *, participant_id: uuid.UUID
) -> tuple[Team, TeamMembership]:
    membership = await crud.get_membership_by_participant_id(db, participant_id=participant_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant is not part of a team",
        )
    team = await crud.get_team_by_id(db, team_id=membership.team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return team, membership


async def get_team_context_for_user(
    db: AsyncSession, *, user: User
) -> tuple[Participant, Team, TeamMembership]:
    participant = await _require_participant(db, user=user)
    team, membership = await get_team_for_participant_id(db, participant_id=participant.id)
    return participant, team, membership


async def _require_participant(db: AsyncSession, user: User) -> Participant:
    participant = await get_participant_by_user_id(db, user.id)
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant profile not found. Create a profile first.",
        )
    return participant


async def _require_team(db: AsyncSession, *, team_id: uuid.UUID) -> Team:
    team = await crud.get_team_by_id(db, team_id=team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return team


async def _ensure_not_in_team(db: AsyncSession, *, participant_id: uuid.UUID) -> None:
    existing = await crud.get_membership_by_participant_id(db, participant_id=participant_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Participant is already in a team",
        )


async def _ensure_self_service_available(participant: Participant) -> None:
    if participant.team_self_service_locked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Team self-service has already been used for this participant",
        )


async def _generate_invite_code(db: AsyncSession) -> str:
    for _ in range(20):
        candidate = "".join(
            secrets.choice(INVITE_CODE_ALPHABET) for _ in range(INVITE_CODE_LENGTH)
        )
        if not await crud.get_team_by_invite_code(db, invite_code=candidate):
            return candidate
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not generate invite code")


async def _build_team_read(db: AsyncSession, team: Team) -> TeamRead:
    members = await crud.list_team_members(db, team_id=team.id)
    return TeamRead(
        id=team.id,
        name=team.name,
        invite_code=team.invite_code,
        created_by_participant_id=team.created_by_participant_id,
        created_at=team.created_at,
        members=[
            TeamMemberRead(
                participant_id=participant.id,
                display_name=participant.display_name,
                joined_at=membership.created_at,
            )
            for membership, participant in members
        ],
    )


async def _set_participant_team(
    db: AsyncSession, *, participant_id: uuid.UUID, target_team_id: uuid.UUID | None
) -> TeamAssignmentRead:
    participant = await get_participant_by_id(db, participant_id)
    if not participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
    membership = await crud.get_membership_by_participant_id(db, participant_id=participant_id)

    if target_team_id is None:
        if membership:
            await crud.delete_membership(db, membership=membership)
        return TeamAssignmentRead(participant_id=participant_id, team_id=None, team_name=None)

    target_team = await _require_team(db, team_id=target_team_id)
    if membership and membership.team_id == target_team_id:
        return TeamAssignmentRead(
            participant_id=participant_id,
            team_id=target_team.id,
            team_name=target_team.name,
        )
    if membership:
        try:
            await crud.update_membership_team(db, membership=membership, team_id=target_team_id)
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Participant is already assigned to that team",
            )
    else:
        try:
            await crud.create_membership(
                db, team_id=target_team_id, participant_id=participant_id
            )
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Participant is already in a team",
            )
    participant.team_self_service_locked = True
    return TeamAssignmentRead(
        participant_id=participant_id,
        team_id=target_team.id,
        team_name=target_team.name,
    )
