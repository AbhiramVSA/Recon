import secrets
import uuid

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.auth.models import User
from app.domains.participants.crud import get_participant_by_user_id
from app.domains.participants.models import Participant
from app.domains.teams import crud
from app.domains.teams.models import Team, TeamMembership
from app.domains.teams.schemas import TeamCreate, TeamJoin, TeamMemberRead, TeamRead

INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
INVITE_CODE_LENGTH = 6


async def create_team_for_user(
    db: AsyncSession, *, user: User, payload: TeamCreate
) -> TeamRead:
    participant = await _require_participant(db, user)
    await _ensure_not_in_team(db, participant_id=participant.id)

    if await crud.get_team_by_name(db, name=payload.name):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Team name already exists")

    team = await crud.create_team(
        db,
        name=payload.name,
        invite_code=await _generate_invite_code(db),
        created_by_participant_id=participant.id,
    )
    await crud.create_membership(db, team_id=team.id, participant_id=participant.id)
    return await _build_team_read(db, team)


async def join_team_for_user(db: AsyncSession, *, user: User, payload: TeamJoin) -> TeamRead:
    participant = await _require_participant(db, user)
    await _ensure_not_in_team(db, participant_id=participant.id)

    team = await crud.get_team_by_invite_code(db, invite_code=payload.invite_code)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    try:
        await crud.create_membership(db, team_id=team.id, participant_id=participant.id)
    except IntegrityError:
        existing = await crud.get_membership_by_participant_id(db, participant_id=participant.id)
        if existing and existing.team_id == team.id:
            return await _build_team_read(db, team)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Participant is already in a team",
        )
    return await _build_team_read(db, team)


async def get_my_team(db: AsyncSession, *, user: User) -> TeamRead:
    participant = await _require_participant(db, user)
    team, _ = await get_team_for_participant_id(db, participant_id=participant.id)
    return await _build_team_read(db, team)


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
    participant = await _require_participant(db, user)
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


async def _ensure_not_in_team(db: AsyncSession, *, participant_id: uuid.UUID) -> None:
    existing = await crud.get_membership_by_participant_id(db, participant_id=participant_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Participant is already in a team",
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
