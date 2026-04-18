from __future__ import annotations

import datetime
import uuid
from collections import defaultdict
from dataclasses import asdict
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.auth.models import User
from app.domains.points import crud
from app.domains.points.models import (
    TeamCompetitionLedger,
    TeamCompetitionRoundScore,
    TeamCompetitionSettlement,
)
from app.domains.points.schemas.point import PointAwardCreate
from app.domains.points.schemas.team_competition import (
    TeamCompetitionAwardDeltaCreate,
    TeamCompetitionAwardRead,
    TeamCompetitionEventSummaryRead,
    TeamCompetitionLeaderboardEntryRead,
    TeamCompetitionLeaderboardPageRead,
    TeamCompetitionMeRead,
    TeamCompetitionRoundScoreRead,
    TeamCompetitionRuleRead,
    TeamCompetitionRulesRead,
    TeamCompetitionSettlementAllocationRead,
    TeamCompetitionSettlementFinalizeCreate,
    TeamCompetitionSettlementListRead,
    TeamCompetitionSettlementPreviewCreate,
    TeamCompetitionSettlementPreviewRead,
    TeamCompetitionSettlementRead,
    TeamCompetitionSnapshotIngestCreate,
    TeamCompetitionTransactionRead,
)
from app.domains.points.service.competition_rules import TEAM_COMPETITION_RULES
from app.domains.points.service.participant_points_service import award_points
from app.domains.teams import crud as team_crud
from app.domains.teams.crud.team import get_team_by_id
from app.domains.teams.service import get_team_context_for_user


async def award_team_competition_delta(
    db: AsyncSession,
    *,
    payload: TeamCompetitionAwardDeltaCreate,
    actor: User | None,
) -> TeamCompetitionAwardRead:
    if payload.raw_score_delta == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="raw_score_delta must be non-zero")
    return await _mutate_team_competition_score(
        db,
        event_key=payload.event_key,
        round_key=payload.round_key,
        team_id=payload.team_id,
        raw_score_target=None,
        raw_score_delta=payload.raw_score_delta,
        raw_score_ceiling=payload.raw_score_ceiling,
        normalized_points_ceiling=payload.normalized_points_ceiling,
        source=payload.source,
        source_reference=payload.source_reference,
        idempotency_key=payload.idempotency_key,
        note=payload.note,
        details_json=payload.details_json,
        mutation_type="delta",
        actor=actor,
    )


async def ingest_team_competition_snapshot(
    db: AsyncSession,
    *,
    payload: TeamCompetitionSnapshotIngestCreate,
    actor: User | None,
) -> TeamCompetitionAwardRead:
    return await _mutate_team_competition_score(
        db,
        event_key=payload.event_key,
        round_key=payload.round_key,
        team_id=payload.team_id,
        raw_score_target=payload.raw_score_total,
        raw_score_delta=None,
        raw_score_ceiling=payload.raw_score_ceiling,
        normalized_points_ceiling=payload.normalized_points_ceiling,
        source=payload.source,
        source_reference=payload.source_reference,
        idempotency_key=payload.idempotency_key,
        note=payload.note,
        details_json=payload.details_json,
        mutation_type="snapshot",
        actor=actor,
    )


async def get_team_competition_leaderboard(
    db: AsyncSession, *, skip: int, limit: int, event_key: str | None
) -> TeamCompetitionLeaderboardPageRead:
    normalized_event_key = event_key.strip().lower() if event_key else None
    if event_key:
        _get_rule(normalized_event_key)
    rows = await crud.list_team_competition_leaderboard_rows(db, event_key=normalized_event_key)
    sliced = rows[skip : skip + limit]
    entries = [
        TeamCompetitionLeaderboardEntryRead(
            rank=skip + index + 1,
            team_id=row[0],
            team_name=row[1],
            normalized_points=row[2],
            last_activity_at=row[3],
        )
        for index, row in enumerate(sliced)
    ]
    return TeamCompetitionLeaderboardPageRead(
        event_key=normalized_event_key,
        total_ranked=len(rows),
        skip=skip,
        limit=limit,
        entries=entries,
    )


async def get_my_team_competition_summary(
    db: AsyncSession, *, user: User
) -> TeamCompetitionMeRead:
    _, team, _ = await get_team_context_for_user(db, user=user)
    round_scores = await crud.list_team_competition_round_scores_for_team(db, team_id=team.id)
    leaderboard_rows = await crud.list_team_competition_leaderboard_rows(db, event_key=None)
    by_event: dict[str, dict[str, int]] = defaultdict(
        lambda: {"normalized_points": 0, "raw_score_total": 0}
    )
    total_points = 0
    for score in round_scores:
        by_event[score.event_key]["normalized_points"] += score.normalized_points_total
        by_event[score.event_key]["raw_score_total"] += score.raw_score_total
        total_points += score.normalized_points_total

    rank = None
    for index, row in enumerate(leaderboard_rows, start=1):
        if row[0] == team.id:
            rank = index
            break

    return TeamCompetitionMeRead(
        team_id=team.id,
        team_name=team.name,
        rank=rank,
        total_ranked=len(leaderboard_rows),
        normalized_points=total_points,
        event_summaries=[
            TeamCompetitionEventSummaryRead(
                event_key=event_key,
                normalized_points=summary["normalized_points"],
                raw_score_total=summary["raw_score_total"],
            )
            for event_key, summary in sorted(by_event.items())
        ],
        rounds=[serialize_team_competition_round_score(score) for score in round_scores],
    )


def get_team_competition_rules() -> TeamCompetitionRulesRead:
    return TeamCompetitionRulesRead(
        rules=[TeamCompetitionRuleRead(**asdict(rule)) for rule in TEAM_COMPETITION_RULES.values()]
    )


async def preview_team_competition_settlement(
    db: AsyncSession,
    *,
    payload: TeamCompetitionSettlementPreviewCreate,
) -> TeamCompetitionSettlementPreviewRead:
    plan = await _build_settlement_plan(
        db,
        team_id=payload.team_id,
        event_key=payload.event_key,
        round_key=payload.round_key,
        participant_points_budget=payload.participant_points_budget,
        note=payload.note,
    )
    return TeamCompetitionSettlementPreviewRead(**plan)


async def finalize_team_competition_settlement(
    db: AsyncSession,
    *,
    payload: TeamCompetitionSettlementFinalizeCreate,
    actor: User,
) -> TeamCompetitionSettlementRead:
    normalized_event_key = payload.event_key.strip().lower()
    normalized_round_key = payload.round_key.strip()
    normalized_idempotency_key = payload.idempotency_key.strip()
    if not normalized_idempotency_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="idempotency_key must not be blank",
        )

    existing = await crud.get_team_competition_settlement_by_idempotency_key(
        db, idempotency_key=normalized_idempotency_key
    )
    if existing:
        _ensure_same_settlement_payload(
            existing=existing,
            team_id=payload.team_id,
            event_key=normalized_event_key,
            round_key=normalized_round_key,
            participant_points_budget=payload.participant_points_budget,
            actor_id=actor.id,
            note=payload.note,
        )
        return await _serialize_settlement(db, settlement=existing)

    existing_round_settlement = await crud.get_team_competition_settlement_for_round(
        db,
        team_id=payload.team_id,
        event_key=normalized_event_key,
        round_key=normalized_round_key,
    )
    if existing_round_settlement:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This team event round has already been settled",
        )

    plan = await _build_settlement_plan(
        db,
        team_id=payload.team_id,
        event_key=normalized_event_key,
        round_key=normalized_round_key,
        participant_points_budget=payload.participant_points_budget,
        note=payload.note,
    )
    settled_at = datetime.datetime.now(datetime.timezone.utc)

    try:
        async with db.begin_nested():
            settlement = await crud.create_team_competition_settlement(
                db,
                team_id=plan["team_id"],
                event_key=plan["event_key"],
                round_key=plan["round_key"],
                participant_points_budget=plan["participant_points_budget"],
                source_raw_score_total=plan["source_raw_score_total"],
                source_raw_score_ceiling=plan["source_raw_score_ceiling"],
                source_normalized_points_total=plan["source_normalized_points_total"],
                source_normalized_points_ceiling=plan["source_normalized_points_ceiling"],
                allocation_mode=plan["allocation_mode"],
                settled_at=settled_at,
                settled_by_user_id=actor.id,
                idempotency_key=normalized_idempotency_key,
                note=plan["note"],
            )
            for ordinal, allocation in enumerate(plan["allocations"], start=1):
                ledger_entry_id = None
                if allocation.allocated_points > 0:
                    ledger_entry, _ = await award_points(
                        db,
                        payload=PointAwardCreate(
                            participant_id=allocation.participant_id,
                            amount=allocation.allocated_points,
                            reason=f"competition.settlement.{plan['event_key']}",
                            reference_id=settlement.id,
                            idempotency_key=_build_allocation_idempotency_key(
                                settlement_id=settlement.id,
                                ordinal=ordinal,
                            ),
                            note=(
                                f"Team settlement for {plan['team_name']} "
                                f"({plan['event_key']} / {plan['round_key']})"
                            ),
                        ),
                        actor=actor,
                    )
                    ledger_entry_id = ledger_entry.id
                await crud.create_team_competition_settlement_allocation(
                    db,
                    settlement_id=settlement.id,
                    participant_id=allocation.participant_id,
                    allocated_points=allocation.allocated_points,
                    point_ledger_entry_id=ledger_entry_id,
                )
    except IntegrityError:
        existing = await crud.get_team_competition_settlement_by_idempotency_key(
            db, idempotency_key=normalized_idempotency_key
        )
        if existing:
            return await _serialize_settlement(db, settlement=existing)
        raise

    return await _serialize_settlement(db, settlement=settlement)


async def list_team_competition_settlements(
    db: AsyncSession,
    *,
    team_id: uuid.UUID | None,
    event_key: str | None,
) -> TeamCompetitionSettlementListRead:
    normalized_event_key = event_key.strip().lower() if event_key else None
    settlements = await crud.list_team_competition_settlements(
        db, team_id=team_id, event_key=normalized_event_key
    )
    return TeamCompetitionSettlementListRead(
        settlements=[
            await _serialize_settlement(db, settlement=settlement)
            for settlement in settlements
        ]
    )


async def get_team_competition_settlement(
    db: AsyncSession, *, settlement_id: uuid.UUID
) -> TeamCompetitionSettlementRead:
    settlement = await crud.get_team_competition_settlement_by_id(
        db, settlement_id=settlement_id
    )
    if not settlement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Settlement not found")
    return await _serialize_settlement(db, settlement=settlement)


def serialize_team_competition_entry(entry: TeamCompetitionLedger) -> TeamCompetitionTransactionRead:
    return TeamCompetitionTransactionRead(
        id=entry.id,
        team_id=entry.team_id,
        event_key=entry.event_key,
        round_key=entry.round_key,
        mutation_type=entry.mutation_type,
        raw_score_delta=entry.raw_score_delta,
        normalized_points_delta=entry.normalized_points_delta,
        resulting_raw_score=entry.resulting_raw_score,
        resulting_normalized_points=entry.resulting_normalized_points,
        raw_score_ceiling=entry.raw_score_ceiling,
        normalized_points_ceiling=entry.normalized_points_ceiling,
        source=entry.source,
        source_reference=entry.source_reference,
        idempotency_key=entry.idempotency_key,
        note=entry.note,
        details_json=entry.details_json,
        recorded_by_user_id=entry.recorded_by_user_id,
        created_at=entry.created_at,
    )


def serialize_team_competition_round_score(
    score: TeamCompetitionRoundScore,
) -> TeamCompetitionRoundScoreRead:
    return TeamCompetitionRoundScoreRead(
        team_id=score.team_id,
        event_key=score.event_key,
        round_key=score.round_key,
        raw_score_total=score.raw_score_total,
        raw_score_ceiling=score.raw_score_ceiling,
        normalized_points_total=score.normalized_points_total,
        normalized_points_ceiling=score.normalized_points_ceiling,
        last_activity_at=score.last_activity_at,
    )


async def _serialize_settlement(
    db: AsyncSession, *, settlement: TeamCompetitionSettlement
) -> TeamCompetitionSettlementRead:
    team = await get_team_by_id(db, team_id=settlement.team_id)
    team_name = team.name if team else "Unknown team"
    allocations = await crud.list_team_competition_settlement_allocations(
        db, settlement_id=settlement.id
    )
    display_names = await crud.get_participant_display_names(
        db,
        participant_ids=[allocation.participant_id for allocation in allocations],
    )
    return TeamCompetitionSettlementRead(
        id=settlement.id,
        team_id=settlement.team_id,
        team_name=team_name,
        event_key=settlement.event_key,
        round_key=settlement.round_key,
        allocation_mode=settlement.allocation_mode,
        participant_points_budget=settlement.participant_points_budget,
        source_raw_score_total=settlement.source_raw_score_total,
        source_raw_score_ceiling=settlement.source_raw_score_ceiling,
        source_normalized_points_total=settlement.source_normalized_points_total,
        source_normalized_points_ceiling=settlement.source_normalized_points_ceiling,
        settled_at=settlement.settled_at,
        settled_by_user_id=settlement.settled_by_user_id,
        idempotency_key=settlement.idempotency_key,
        note=settlement.note,
        allocations=[
            TeamCompetitionSettlementAllocationRead(
                participant_id=allocation.participant_id,
                display_name=display_names.get(allocation.participant_id, "Unknown participant"),
                allocated_points=allocation.allocated_points,
            )
            for allocation in allocations
        ],
    )


async def _mutate_team_competition_score(
    db: AsyncSession,
    *,
    event_key: str,
    round_key: str,
    team_id: uuid.UUID,
    raw_score_target: int | None,
    raw_score_delta: int | None,
    raw_score_ceiling: int | None,
    normalized_points_ceiling: int | None,
    source: str,
    source_reference: str | None,
    idempotency_key: str,
    note: str | None,
    details_json: dict[str, Any] | None,
    mutation_type: str,
    actor: User | None,
) -> TeamCompetitionAwardRead:
    normalized_event_key = event_key.strip().lower()
    normalized_round_key = round_key.strip()
    normalized_source = source.strip()
    if not idempotency_key.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="idempotency_key must not be blank")
    if not normalized_round_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="round_key must not be blank")
    if not normalized_source:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="source must not be blank")
    rule = _get_rule(normalized_event_key)
    if mutation_type == "snapshot" and not rule.supports_snapshot_ingest:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"event_key '{normalized_event_key}' does not support snapshot ingestion",
        )
    if mutation_type == "delta" and not rule.supports_delta_awards:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"event_key '{normalized_event_key}' does not support delta awards",
        )
    team = await get_team_by_id(db, team_id=team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    resolved_raw_ceiling, resolved_normalized_ceiling = _resolve_ceilings(
        rule=rule,
        raw_score_ceiling=raw_score_ceiling,
        normalized_points_ceiling=normalized_points_ceiling,
    )

    existing_entry = await crud.get_team_competition_entry_by_idempotency_key(
        db, idempotency_key=idempotency_key
    )
    if existing_entry:
        if _team_competition_entry_matches(
            existing=existing_entry,
            team_id=team_id,
            event_key=normalized_event_key,
            round_key=normalized_round_key,
            raw_score_target=raw_score_target,
            raw_score_delta=raw_score_delta,
            raw_score_ceiling=resolved_raw_ceiling,
            normalized_points_ceiling=resolved_normalized_ceiling,
            source=normalized_source,
            source_reference=source_reference,
            note=note,
            details_json=details_json,
            recorded_by_user_id=actor.id if actor else None,
        ):
            score = await _get_or_create_team_round_score(
                db,
                team_id=team_id,
                event_key=normalized_event_key,
                round_key=normalized_round_key,
                raw_score_ceiling=resolved_raw_ceiling,
                normalized_points_ceiling=resolved_normalized_ceiling,
            )
            return TeamCompetitionAwardRead(
                transaction=serialize_team_competition_entry(existing_entry),
                round_score=serialize_team_competition_round_score(score),
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="idempotency_key already exists for a different team competition payload",
        )

    score = await _get_or_create_team_round_score(
        db,
        team_id=team_id,
        event_key=normalized_event_key,
        round_key=normalized_round_key,
        raw_score_ceiling=resolved_raw_ceiling,
        normalized_points_ceiling=resolved_normalized_ceiling,
    )
    score = await _lock_team_round_score(
        db,
        team_id=team_id,
        event_key=normalized_event_key,
        round_key=normalized_round_key,
        raw_score_ceiling=resolved_raw_ceiling,
        normalized_points_ceiling=resolved_normalized_ceiling,
    )
    _validate_round_ceilings(
        score=score,
        raw_score_ceiling=resolved_raw_ceiling,
        normalized_points_ceiling=resolved_normalized_ceiling,
    )

    if raw_score_target is not None:
        if raw_score_target < score.raw_score_total:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="raw_score_total cannot decrease for an existing round; use a new round_key for resets",
            )
        next_raw_score = raw_score_target
        effective_raw_delta = raw_score_target - score.raw_score_total
    else:
        next_raw_score = score.raw_score_total + int(raw_score_delta or 0)
        effective_raw_delta = int(raw_score_delta or 0)

    if next_raw_score < 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Team competition score cannot go negative",
        )

    next_normalized = _normalize_score(
        raw_score_total=next_raw_score,
        raw_score_ceiling=score.raw_score_ceiling,
        normalized_points_ceiling=score.normalized_points_ceiling,
    )
    normalized_delta = next_normalized - score.normalized_points_total
    recorded_by_user_id = actor.id if actor else None

    try:
        async with db.begin_nested():
            entry = await crud.create_team_competition_entry(
                db,
                team_id=team_id,
                event_key=normalized_event_key,
                round_key=normalized_round_key,
                mutation_type=mutation_type,
                raw_score_delta=effective_raw_delta,
                normalized_points_delta=normalized_delta,
                resulting_raw_score=next_raw_score,
                resulting_normalized_points=next_normalized,
                raw_score_ceiling=score.raw_score_ceiling,
                normalized_points_ceiling=score.normalized_points_ceiling,
                source=normalized_source,
                source_reference=source_reference,
                idempotency_key=idempotency_key,
                note=note,
                details_json=details_json,
                recorded_by_user_id=recorded_by_user_id,
            )
    except IntegrityError:
        existing_entry = await crud.get_team_competition_entry_by_idempotency_key(
            db, idempotency_key=idempotency_key
        )
        if existing_entry and _team_competition_entry_matches(
            existing=existing_entry,
            team_id=team_id,
            event_key=normalized_event_key,
            round_key=normalized_round_key,
            raw_score_target=raw_score_target,
            raw_score_delta=raw_score_delta,
            raw_score_ceiling=resolved_raw_ceiling,
            normalized_points_ceiling=resolved_normalized_ceiling,
            source=normalized_source,
            source_reference=source_reference,
            note=note,
            details_json=details_json,
            recorded_by_user_id=recorded_by_user_id,
        ):
            score = await _lock_team_round_score(
                db,
                team_id=team_id,
                event_key=normalized_event_key,
                round_key=normalized_round_key,
                raw_score_ceiling=resolved_raw_ceiling,
                normalized_points_ceiling=resolved_normalized_ceiling,
            )
            return TeamCompetitionAwardRead(
                transaction=serialize_team_competition_entry(existing_entry),
                round_score=serialize_team_competition_round_score(score),
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="idempotency_key already exists for a different team competition payload",
        )

    score.raw_score_total = next_raw_score
    score.normalized_points_total = next_normalized
    score.last_activity_at = entry.created_at
    score = await crud.save_team_round_score(db, score=score)
    return TeamCompetitionAwardRead(
        transaction=serialize_team_competition_entry(entry),
        round_score=serialize_team_competition_round_score(score),
    )


async def _build_settlement_plan(
    db: AsyncSession,
    *,
    team_id: uuid.UUID,
    event_key: str,
    round_key: str,
    participant_points_budget: int,
    note: str | None,
) -> dict[str, Any]:
    normalized_event_key = event_key.strip().lower()
    normalized_round_key = round_key.strip()
    if not normalized_round_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="round_key must not be blank")
    _get_rule(normalized_event_key)
    team = await get_team_by_id(db, team_id=team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    round_score = await crud.get_team_round_score(
        db,
        team_id=team_id,
        event_key=normalized_event_key,
        round_key=normalized_round_key,
    )
    if not round_score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team event round score not found",
        )
    memberships = await team_crud.list_team_members(db, team_id=team_id)
    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot settle points for a team with no members",
        )

    ordered_members = sorted(memberships, key=lambda row: (row[0].created_at, row[1].id))
    allocations = _allocate_points(
        participant_points_budget=participant_points_budget,
        ordered_members=ordered_members,
    )
    return {
        "team_id": team.id,
        "team_name": team.name,
        "event_key": normalized_event_key,
        "round_key": normalized_round_key,
        "allocation_mode": "equal_split",
        "member_count": len(ordered_members),
        "participant_points_budget": participant_points_budget,
        "source_raw_score_total": round_score.raw_score_total,
        "source_raw_score_ceiling": round_score.raw_score_ceiling,
        "source_normalized_points_total": round_score.normalized_points_total,
        "source_normalized_points_ceiling": round_score.normalized_points_ceiling,
        "allocations": allocations,
        "note": note,
    }


def _allocate_points(
    *,
    participant_points_budget: int,
    ordered_members,
) -> list[TeamCompetitionSettlementAllocationRead]:
    member_count = len(ordered_members)
    base = participant_points_budget // member_count
    remainder = participant_points_budget % member_count
    allocations: list[TeamCompetitionSettlementAllocationRead] = []
    for index, (_, participant) in enumerate(ordered_members):
        allocated = base + (1 if index < remainder else 0)
        allocations.append(
            TeamCompetitionSettlementAllocationRead(
                participant_id=participant.id,
                display_name=participant.display_name,
                allocated_points=allocated,
            )
        )
    return allocations


async def _get_or_create_team_round_score(
    db: AsyncSession,
    *,
    team_id: uuid.UUID,
    event_key: str,
    round_key: str,
    raw_score_ceiling: int,
    normalized_points_ceiling: int,
) -> TeamCompetitionRoundScore:
    score = await crud.get_team_round_score(
        db, team_id=team_id, event_key=event_key, round_key=round_key
    )
    if score:
        return score
    try:
        return await crud.create_team_round_score(
            db,
            team_id=team_id,
            event_key=event_key,
            round_key=round_key,
            raw_score_ceiling=raw_score_ceiling,
            normalized_points_ceiling=normalized_points_ceiling,
        )
    except IntegrityError:
        score = await crud.get_team_round_score(
            db, team_id=team_id, event_key=event_key, round_key=round_key
        )
        if score:
            return score
        raise


async def _lock_team_round_score(
    db: AsyncSession,
    *,
    team_id: uuid.UUID,
    event_key: str,
    round_key: str,
    raw_score_ceiling: int,
    normalized_points_ceiling: int,
) -> TeamCompetitionRoundScore:
    score = await crud.get_team_round_score_for_update(
        db, team_id=team_id, event_key=event_key, round_key=round_key
    )
    if score:
        return score
    await _get_or_create_team_round_score(
        db,
        team_id=team_id,
        event_key=event_key,
        round_key=round_key,
        raw_score_ceiling=raw_score_ceiling,
        normalized_points_ceiling=normalized_points_ceiling,
    )
    score = await crud.get_team_round_score_for_update(
        db, team_id=team_id, event_key=event_key, round_key=round_key
    )
    if not score:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not lock team competition round score",
        )
    return score


def _get_rule(event_key: str):
    normalized = event_key.strip().lower()
    rule = TEAM_COMPETITION_RULES.get(normalized)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported event_key '{event_key}'. Supported keys: {', '.join(sorted(TEAM_COMPETITION_RULES))}",
        )
    return rule


def _resolve_ceilings(
    *,
    rule,
    raw_score_ceiling: int | None,
    normalized_points_ceiling: int | None,
) -> tuple[int, int]:
    resolved_raw = raw_score_ceiling or rule.default_raw_score_ceiling
    if resolved_raw is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"raw_score_ceiling is required for event_key '{rule.event_key}'",
        )
    resolved_normalized = normalized_points_ceiling or rule.default_normalized_points_ceiling
    if resolved_raw <= 0 or resolved_normalized <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Score ceilings must be positive integers",
        )
    return resolved_raw, resolved_normalized


def _validate_round_ceilings(
    *,
    score: TeamCompetitionRoundScore,
    raw_score_ceiling: int,
    normalized_points_ceiling: int,
) -> None:
    if (
        score.raw_score_ceiling != raw_score_ceiling
        or score.normalized_points_ceiling != normalized_points_ceiling
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Existing round score uses different normalization ceilings",
        )


def _normalize_score(
    *, raw_score_total: int, raw_score_ceiling: int, normalized_points_ceiling: int
) -> int:
    clamped_raw = min(max(raw_score_total, 0), raw_score_ceiling)
    return (clamped_raw * normalized_points_ceiling) // raw_score_ceiling


def _team_competition_entry_matches(
    *,
    existing: TeamCompetitionLedger,
    team_id: uuid.UUID,
    event_key: str,
    round_key: str,
    raw_score_target: int | None,
    raw_score_delta: int | None,
    raw_score_ceiling: int,
    normalized_points_ceiling: int,
    source: str,
    source_reference: str | None,
    note: str | None,
    details_json: dict[str, Any] | None,
    recorded_by_user_id: uuid.UUID | None,
) -> bool:
    if existing.team_id != team_id:
        return False
    if existing.event_key != event_key.strip().lower():
        return False
    if existing.round_key != round_key.strip():
        return False
    if existing.raw_score_ceiling != raw_score_ceiling:
        return False
    if existing.normalized_points_ceiling != normalized_points_ceiling:
        return False
    if existing.source != source.strip():
        return False
    if existing.source_reference != source_reference:
        return False
    if existing.note != note:
        return False
    if (existing.details_json or None) != (details_json or None):
        return False
    if existing.recorded_by_user_id != recorded_by_user_id:
        return False
    if raw_score_target is not None:
        return (
            existing.mutation_type == "snapshot"
            and existing.resulting_raw_score == raw_score_target
        )
    return existing.mutation_type == "delta" and existing.raw_score_delta == int(raw_score_delta or 0)


def _build_allocation_idempotency_key(*, settlement_id: uuid.UUID, ordinal: int) -> str:
    return f"team-settle:{settlement_id}:{ordinal}"


def _ensure_same_settlement_payload(
    *,
    existing: TeamCompetitionSettlement,
    team_id: uuid.UUID,
    event_key: str,
    round_key: str,
    participant_points_budget: int,
    actor_id: uuid.UUID,
    note: str | None,
) -> None:
    if (
        existing.team_id != team_id
        or existing.event_key != event_key
        or existing.round_key != round_key
        or existing.participant_points_budget != participant_points_budget
        or existing.settled_by_user_id != actor_id
        or existing.note != note
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="idempotency_key already exists for a different settlement payload",
        )
