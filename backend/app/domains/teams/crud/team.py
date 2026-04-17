import uuid

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.participants.models import Participant
from app.domains.teams.models import Team, TeamMembership


async def get_team_by_id(db: AsyncSession, *, team_id: uuid.UUID) -> Team | None:
    return await db.get(Team, team_id)


async def get_team_by_name(db: AsyncSession, *, name: str) -> Team | None:
    result = await db.exec(select(Team).where(Team.name == name))
    return result.one_or_none()


async def get_team_by_invite_code(db: AsyncSession, *, invite_code: str) -> Team | None:
    result = await db.exec(select(Team).where(Team.invite_code == invite_code))
    return result.one_or_none()


async def create_team(
    db: AsyncSession,
    *,
    name: str,
    invite_code: str,
    created_by_participant_id: uuid.UUID,
) -> Team:
    team = Team(
        name=name,
        invite_code=invite_code,
        created_by_participant_id=created_by_participant_id,
    )
    db.add(team)
    await db.flush()
    await db.refresh(team)
    return team


async def get_membership_by_participant_id(
    db: AsyncSession, *, participant_id: uuid.UUID
) -> TeamMembership | None:
    result = await db.exec(
        select(TeamMembership).where(TeamMembership.participant_id == participant_id)
    )
    return result.one_or_none()


async def create_membership(
    db: AsyncSession, *, team_id: uuid.UUID, participant_id: uuid.UUID
) -> TeamMembership:
    membership = TeamMembership(team_id=team_id, participant_id=participant_id)
    db.add(membership)
    await db.flush()
    await db.refresh(membership)
    return membership


async def list_team_members(
    db: AsyncSession, *, team_id: uuid.UUID
) -> list[tuple[TeamMembership, Participant]]:
    stmt = (
        select(TeamMembership, Participant)
        .join(Participant, Participant.id == TeamMembership.participant_id)
        .where(TeamMembership.team_id == team_id)
        .order_by(TeamMembership.created_at.asc(), Participant.display_name.asc())
    )
    result = await db.exec(stmt)
    return list(result.all())
