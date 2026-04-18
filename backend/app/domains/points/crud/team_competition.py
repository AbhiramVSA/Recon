import uuid

from sqlalchemy import case
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.points.models import (
    TeamCompetitionLedger,
    TeamCompetitionRoundScore,
    TeamCompetitionSettlement,
    TeamCompetitionSettlementAllocation,
)
from app.domains.teams.models import Team


async def get_team_round_score(
    db: AsyncSession, *, team_id: uuid.UUID, event_key: str, round_key: str
) -> TeamCompetitionRoundScore | None:
    stmt = select(TeamCompetitionRoundScore).where(
        TeamCompetitionRoundScore.team_id == team_id,
        TeamCompetitionRoundScore.event_key == event_key,
        TeamCompetitionRoundScore.round_key == round_key,
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def get_team_round_score_for_update(
    db: AsyncSession, *, team_id: uuid.UUID, event_key: str, round_key: str
) -> TeamCompetitionRoundScore | None:
    stmt = (
        select(TeamCompetitionRoundScore)
        .where(
            TeamCompetitionRoundScore.team_id == team_id,
            TeamCompetitionRoundScore.event_key == event_key,
            TeamCompetitionRoundScore.round_key == round_key,
        )
        .with_for_update()
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def create_team_round_score(
    db: AsyncSession,
    *,
    team_id: uuid.UUID,
    event_key: str,
    round_key: str,
    raw_score_ceiling: int,
    normalized_points_ceiling: int,
) -> TeamCompetitionRoundScore:
    score = TeamCompetitionRoundScore(
        team_id=team_id,
        event_key=event_key,
        round_key=round_key,
        raw_score_ceiling=raw_score_ceiling,
        normalized_points_ceiling=normalized_points_ceiling,
    )
    db.add(score)
    await db.flush()
    await db.refresh(score)
    return score


async def save_team_round_score(
    db: AsyncSession, *, score: TeamCompetitionRoundScore
) -> TeamCompetitionRoundScore:
    db.add(score)
    await db.flush()
    await db.refresh(score)
    return score


async def get_team_competition_entry_by_idempotency_key(
    db: AsyncSession, *, idempotency_key: str
) -> TeamCompetitionLedger | None:
    stmt = select(TeamCompetitionLedger).where(
        TeamCompetitionLedger.idempotency_key == idempotency_key
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def create_team_competition_entry(
    db: AsyncSession,
    *,
    team_id: uuid.UUID,
    event_key: str,
    round_key: str,
    mutation_type: str,
    raw_score_delta: int,
    normalized_points_delta: int,
    resulting_raw_score: int,
    resulting_normalized_points: int,
    raw_score_ceiling: int,
    normalized_points_ceiling: int,
    source: str,
    source_reference: str | None,
    idempotency_key: str,
    note: str | None,
    details_json: dict | None,
    recorded_by_user_id: uuid.UUID | None,
) -> TeamCompetitionLedger:
    entry = TeamCompetitionLedger(
        team_id=team_id,
        event_key=event_key,
        round_key=round_key,
        mutation_type=mutation_type,
        raw_score_delta=raw_score_delta,
        normalized_points_delta=normalized_points_delta,
        resulting_raw_score=resulting_raw_score,
        resulting_normalized_points=resulting_normalized_points,
        raw_score_ceiling=raw_score_ceiling,
        normalized_points_ceiling=normalized_points_ceiling,
        source=source,
        source_reference=source_reference,
        idempotency_key=idempotency_key,
        note=note,
        details_json=details_json,
        recorded_by_user_id=recorded_by_user_id,
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


async def list_team_competition_round_scores_for_team(
    db: AsyncSession, *, team_id: uuid.UUID
) -> list[TeamCompetitionRoundScore]:
    stmt = (
        select(TeamCompetitionRoundScore)
        .where(TeamCompetitionRoundScore.team_id == team_id)
        .order_by(
            TeamCompetitionRoundScore.event_key.asc(),
            TeamCompetitionRoundScore.round_key.asc(),
        )
    )
    result = await db.exec(stmt)
    return list(result.all())


async def list_team_competition_leaderboard_rows(
    db: AsyncSession, *, event_key: str | None
) -> list[tuple[uuid.UUID, str, int, object]]:
    total_points = func.coalesce(func.sum(TeamCompetitionRoundScore.normalized_points_total), 0)
    last_activity_at = func.max(TeamCompetitionRoundScore.last_activity_at)
    stmt = (
        select(
            Team.id,
            Team.name,
            total_points,
            last_activity_at,
        )
        .select_from(Team)
        .outerjoin(TeamCompetitionRoundScore, TeamCompetitionRoundScore.team_id == Team.id)
        .group_by(Team.id, Team.name, Team.created_at)
        .order_by(
            total_points.desc(),
            case((last_activity_at.is_(None), 1), else_=0).asc(),
            last_activity_at.asc(),
            Team.created_at.asc(),
            Team.id.asc(),
        )
    )
    if event_key:
        stmt = stmt.where(TeamCompetitionRoundScore.event_key == event_key)
    result = await db.exec(stmt)
    return [(row[0], row[1], int(row[2]), row[3]) for row in result.all()]


async def team_has_competition_activity(
    db: AsyncSession, *, team_id: uuid.UUID
) -> bool:
    round_score_stmt = select(func.count()).select_from(TeamCompetitionRoundScore).where(
        TeamCompetitionRoundScore.team_id == team_id
    )
    round_score_count = int((await db.exec(round_score_stmt)).one())
    if round_score_count > 0:
        return True

    settlement_stmt = select(func.count()).select_from(TeamCompetitionSettlement).where(
        TeamCompetitionSettlement.team_id == team_id
    )
    settlement_count = int((await db.exec(settlement_stmt)).one())
    return settlement_count > 0


async def get_team_competition_settlement_by_id(
    db: AsyncSession, *, settlement_id: uuid.UUID
) -> TeamCompetitionSettlement | None:
    return await db.get(TeamCompetitionSettlement, settlement_id)


async def get_team_competition_settlement_by_idempotency_key(
    db: AsyncSession, *, idempotency_key: str
) -> TeamCompetitionSettlement | None:
    stmt = select(TeamCompetitionSettlement).where(
        TeamCompetitionSettlement.idempotency_key == idempotency_key
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def get_team_competition_settlement_for_round(
    db: AsyncSession, *, team_id: uuid.UUID, event_key: str, round_key: str
) -> TeamCompetitionSettlement | None:
    stmt = select(TeamCompetitionSettlement).where(
        TeamCompetitionSettlement.team_id == team_id,
        TeamCompetitionSettlement.event_key == event_key,
        TeamCompetitionSettlement.round_key == round_key,
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def create_team_competition_settlement(
    db: AsyncSession,
    *,
    team_id: uuid.UUID,
    event_key: str,
    round_key: str,
    participant_points_budget: int,
    source_raw_score_total: int,
    source_raw_score_ceiling: int,
    source_normalized_points_total: int,
    source_normalized_points_ceiling: int,
    allocation_mode: str,
    settled_at,
    settled_by_user_id: uuid.UUID,
    idempotency_key: str,
    note: str | None,
) -> TeamCompetitionSettlement:
    settlement = TeamCompetitionSettlement(
        team_id=team_id,
        event_key=event_key,
        round_key=round_key,
        participant_points_budget=participant_points_budget,
        source_raw_score_total=source_raw_score_total,
        source_raw_score_ceiling=source_raw_score_ceiling,
        source_normalized_points_total=source_normalized_points_total,
        source_normalized_points_ceiling=source_normalized_points_ceiling,
        allocation_mode=allocation_mode,
        settled_at=settled_at,
        settled_by_user_id=settled_by_user_id,
        idempotency_key=idempotency_key,
        note=note,
    )
    db.add(settlement)
    await db.flush()
    await db.refresh(settlement)
    return settlement


async def create_team_competition_settlement_allocation(
    db: AsyncSession,
    *,
    settlement_id: uuid.UUID,
    participant_id: uuid.UUID,
    allocated_points: int,
    point_ledger_entry_id: uuid.UUID | None,
) -> TeamCompetitionSettlementAllocation:
    allocation = TeamCompetitionSettlementAllocation(
        settlement_id=settlement_id,
        participant_id=participant_id,
        allocated_points=allocated_points,
        point_ledger_entry_id=point_ledger_entry_id,
    )
    db.add(allocation)
    await db.flush()
    await db.refresh(allocation)
    return allocation


async def list_team_competition_settlement_allocations(
    db: AsyncSession, *, settlement_id: uuid.UUID
) -> list[TeamCompetitionSettlementAllocation]:
    stmt = (
        select(TeamCompetitionSettlementAllocation)
        .where(TeamCompetitionSettlementAllocation.settlement_id == settlement_id)
        .order_by(
            TeamCompetitionSettlementAllocation.created_at.asc(),
            TeamCompetitionSettlementAllocation.participant_id.asc(),
        )
    )
    result = await db.exec(stmt)
    return list(result.all())


async def list_team_competition_settlements(
    db: AsyncSession,
    *,
    team_id: uuid.UUID | None = None,
    event_key: str | None = None,
) -> list[TeamCompetitionSettlement]:
    stmt = select(TeamCompetitionSettlement)
    if team_id is not None:
        stmt = stmt.where(TeamCompetitionSettlement.team_id == team_id)
    if event_key is not None:
        stmt = stmt.where(TeamCompetitionSettlement.event_key == event_key)
    stmt = stmt.order_by(
        TeamCompetitionSettlement.settled_at.desc(),
        TeamCompetitionSettlement.created_at.desc(),
        TeamCompetitionSettlement.id.asc(),
    )
    result = await db.exec(stmt)
    return list(result.all())
