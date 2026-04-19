import datetime
import uuid

from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.auth.models import User
from app.domains.points.schemas import (
    PointAwardCreate,
    PointAwardRead,
    PointLeaderboardMeRead,
    PointLeaderboardPageRead,
    PointMeRead,
    TeamCompetitionAwardDeltaCreate,
    TeamCompetitionAwardRead,
    TeamCompetitionLeaderboardPageRead,
    TeamCompetitionMeRead,
    TeamCompetitionRulesRead,
    TeamCompetitionSettlementFinalizeCreate,
    TeamCompetitionSettlementListRead,
    TeamCompetitionSettlementPreviewCreate,
    TeamCompetitionSettlementPreviewRead,
    TeamCompetitionSettlementRead,
    TeamCompetitionSnapshotIngestCreate,
    PointTransactionsPageRead,
)
from app.domains.points.service import (
    award_points,
    award_team_competition_delta,
    finalize_team_competition_settlement,
    get_leaderboard,
    get_my_points_summary,
    get_my_rank,
    get_my_team_competition_summary,
    get_team_competition_leaderboard,
    get_team_competition_rules,
    get_team_competition_settlement,
    get_transactions_for_admin,
    ingest_team_competition_snapshot,
    list_team_competition_settlements,
    preview_team_competition_settlement,
    serialize_transaction,
)


async def award(
    db: AsyncSession,
    *,
    payload: PointAwardCreate,
    actor: User,
) -> PointAwardRead:
    tx, balance = await award_points(db, payload=payload, actor=actor)
    return PointAwardRead(transaction=serialize_transaction(tx), resulting_balance=balance)


async def me(db: AsyncSession, *, user: User, recent_limit: int) -> PointMeRead:
    return await get_my_points_summary(db, user=user, recent_limit=recent_limit)


async def leaderboard(db: AsyncSession, *, skip: int, limit: int) -> PointLeaderboardPageRead:
    return await get_leaderboard(db, skip=skip, limit=limit)


async def leaderboard_me(db: AsyncSession, *, user: User) -> PointLeaderboardMeRead:
    return await get_my_rank(db, user=user)


async def transactions(
    db: AsyncSession,
    *,
    participant_id: uuid.UUID | None,
    reason: str | None,
    min_amount: int | None,
    max_amount: int | None,
    start_at: datetime.datetime | None,
    end_at: datetime.datetime | None,
    skip: int,
    limit: int,
) -> PointTransactionsPageRead:
    return await get_transactions_for_admin(
        db,
        participant_id=participant_id,
        reason=reason,
        min_amount=min_amount,
        max_amount=max_amount,
        start_at=start_at,
        end_at=end_at,
        skip=skip,
        limit=limit,
    )


async def team_award_delta(
    db: AsyncSession,
    *,
    payload: TeamCompetitionAwardDeltaCreate,
    actor: User,
) -> TeamCompetitionAwardRead:
    return await award_team_competition_delta(db, payload=payload, actor=actor)


async def team_ingest_snapshot(
    db: AsyncSession,
    *,
    payload: TeamCompetitionSnapshotIngestCreate,
    actor: User,
) -> TeamCompetitionAwardRead:
    return await ingest_team_competition_snapshot(db, payload=payload, actor=actor)


async def team_leaderboard(
    db: AsyncSession,
    *,
    skip: int,
    limit: int,
    event_key: str | None,
) -> TeamCompetitionLeaderboardPageRead:
    return await get_team_competition_leaderboard(
        db, skip=skip, limit=limit, event_key=event_key
    )


async def team_me(db: AsyncSession, *, user: User) -> TeamCompetitionMeRead:
    return await get_my_team_competition_summary(db, user=user)


async def team_rules() -> TeamCompetitionRulesRead:
    return get_team_competition_rules()


async def team_settlement_preview(
    db: AsyncSession,
    *,
    payload: TeamCompetitionSettlementPreviewCreate,
) -> TeamCompetitionSettlementPreviewRead:
    return await preview_team_competition_settlement(db, payload=payload)


async def team_settlement_finalize(
    db: AsyncSession,
    *,
    payload: TeamCompetitionSettlementFinalizeCreate,
    actor: User,
) -> TeamCompetitionSettlementRead:
    return await finalize_team_competition_settlement(db, payload=payload, actor=actor)


async def team_settlements(
    db: AsyncSession,
    *,
    team_id: uuid.UUID | None,
    event_key: str | None,
) -> TeamCompetitionSettlementListRead:
    return await list_team_competition_settlements(
        db, team_id=team_id, event_key=event_key
    )


async def team_settlement_by_id(
    db: AsyncSession, *, settlement_id: uuid.UUID
) -> TeamCompetitionSettlementRead:
    return await get_team_competition_settlement(db, settlement_id=settlement_id)
