import uuid
from datetime import datetime

from sqlalchemy import case
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.teams.models import Team
from app.domains.treasure_hunt.models import (
    TreasureHuntProblem,
    TreasureHuntSolve,
    TreasureHuntTeamProgress,
)


async def get_problem_by_qr_token(
    db: AsyncSession, *, qr_token: str
) -> TreasureHuntProblem | None:
    stmt = select(TreasureHuntProblem).where(
        TreasureHuntProblem.qr_token == qr_token,
        TreasureHuntProblem.is_active.is_(True),
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def get_problem_by_id(
    db: AsyncSession, *, problem_id: uuid.UUID
) -> TreasureHuntProblem | None:
    stmt = select(TreasureHuntProblem).where(
        TreasureHuntProblem.id == problem_id,
        TreasureHuntProblem.is_active.is_(True),
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def list_active_problems(db: AsyncSession) -> list[TreasureHuntProblem]:
    stmt = (
        select(TreasureHuntProblem)
        .where(TreasureHuntProblem.is_active.is_(True))
        .order_by(TreasureHuntProblem.sort_order.asc(), TreasureHuntProblem.id.asc())
    )
    result = await db.exec(stmt)
    return list(result.all())


async def count_active_problems(db: AsyncSession) -> int:
    stmt = (
        select(func.count())
        .select_from(TreasureHuntProblem)
        .where(TreasureHuntProblem.is_active.is_(True))
    )
    result = await db.exec(stmt)
    return int(result.one())


async def get_solve_by_team_and_problem(
    db: AsyncSession, *, team_id: uuid.UUID, problem_id: uuid.UUID
) -> TreasureHuntSolve | None:
    stmt = select(TreasureHuntSolve).where(
        TreasureHuntSolve.team_id == team_id,
        TreasureHuntSolve.problem_id == problem_id,
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def get_solve_by_idempotency_key(
    db: AsyncSession, *, idempotency_key: str
) -> TreasureHuntSolve | None:
    stmt = select(TreasureHuntSolve).where(TreasureHuntSolve.idempotency_key == idempotency_key)
    result = await db.exec(stmt)
    return result.one_or_none()


async def create_solve(
    db: AsyncSession,
    *,
    team_id: uuid.UUID,
    problem_id: uuid.UUID,
    solved_by_participant_id: uuid.UUID,
    idempotency_key: str,
) -> TreasureHuntSolve:
    solve = TreasureHuntSolve(
        team_id=team_id,
        problem_id=problem_id,
        solved_by_participant_id=solved_by_participant_id,
        idempotency_key=idempotency_key,
    )
    db.add(solve)
    await db.flush()
    await db.refresh(solve)
    return solve


async def list_team_solves(
    db: AsyncSession, *, team_id: uuid.UUID
) -> list[TreasureHuntSolve]:
    stmt = (
        select(TreasureHuntSolve)
        .where(TreasureHuntSolve.team_id == team_id)
        .order_by(TreasureHuntSolve.solved_at.asc(), TreasureHuntSolve.id.asc())
    )
    result = await db.exec(stmt)
    return list(result.all())


async def get_team_progress(
    db: AsyncSession, *, team_id: uuid.UUID
) -> TreasureHuntTeamProgress | None:
    stmt = select(TreasureHuntTeamProgress).where(TreasureHuntTeamProgress.team_id == team_id)
    result = await db.exec(stmt)
    return result.one_or_none()


async def get_team_progress_for_update(
    db: AsyncSession, *, team_id: uuid.UUID
) -> TreasureHuntTeamProgress | None:
    stmt = (
        select(TreasureHuntTeamProgress)
        .where(TreasureHuntTeamProgress.team_id == team_id)
        .with_for_update()
    )
    result = await db.exec(stmt)
    return result.one_or_none()


async def create_team_progress(
    db: AsyncSession, *, team_id: uuid.UUID
) -> TreasureHuntTeamProgress:
    progress = TreasureHuntTeamProgress(team_id=team_id)
    db.add(progress)
    await db.flush()
    await db.refresh(progress)
    return progress


async def save_team_progress(
    db: AsyncSession, *, progress: TreasureHuntTeamProgress
) -> TreasureHuntTeamProgress:
    db.add(progress)
    await db.flush()
    await db.refresh(progress)
    return progress


async def list_leaderboard_rows(
    db: AsyncSession,
) -> list[tuple[uuid.UUID, str, int, datetime | None, datetime | None, int | None]]:
    solved_count = func.coalesce(TreasureHuntTeamProgress.solved_count, 0)
    stmt = (
        select(
            Team.id,
            Team.name,
            solved_count,
            TreasureHuntTeamProgress.last_solved_at,
            TreasureHuntTeamProgress.completed_at,
            TreasureHuntTeamProgress.finish_rank,
        )
        .select_from(Team)
        .outerjoin(TreasureHuntTeamProgress, TreasureHuntTeamProgress.team_id == Team.id)
        .order_by(
            solved_count.desc(),
            case((TreasureHuntTeamProgress.completed_at.is_(None), 1), else_=0).asc(),
            TreasureHuntTeamProgress.completed_at.asc(),
            case((TreasureHuntTeamProgress.last_solved_at.is_(None), 1), else_=0).asc(),
            TreasureHuntTeamProgress.last_solved_at.asc(),
            Team.created_at.asc(),
            Team.id.asc(),
        )
    )
    result = await db.exec(stmt)
    return [
        (row[0], row[1], int(row[2]), row[3], row[4], row[5])
        for row in result.all()
    ]


async def list_finishers(
    db: AsyncSession,
) -> list[tuple[uuid.UUID, str, int, datetime | None, datetime | None, int | None]]:
    rows = await list_leaderboard_rows(db)
    return [row for row in rows if row[5] is not None][:4]
