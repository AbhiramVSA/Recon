import hashlib
import hmac
import uuid

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.auth.models import User
from app.domains.teams.service import get_team_context_for_user
from app.domains.treasure_hunt import crud
from app.domains.treasure_hunt.models import TreasureHuntTeamProgress
from app.domains.treasure_hunt.schemas import (
    TreasureHuntFlagSubmit,
    TreasureHuntFlagSubmitRead,
    TreasureHuntLeaderboardEntryRead,
    TreasureHuntLeaderboardRead,
    TreasureHuntProblemRead,
    TreasureHuntProblemStatusRead,
    TreasureHuntTeamProgressRead,
)

MAX_FINISHERS = 4


async def reveal_problem(
    db: AsyncSession, *, user: User, qr_token: str
) -> TreasureHuntProblemRead:
    _, team, _ = await get_team_context_for_user(db, user=user)
    problem = await crud.get_problem_by_qr_token(db, qr_token=qr_token)
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    solve = await crud.get_solve_by_team_and_problem(db, team_id=team.id, problem_id=problem.id)
    return TreasureHuntProblemRead(
        id=problem.id,
        slug=problem.slug,
        title=problem.title,
        teaser=problem.teaser,
        body_markdown=problem.body_markdown,
        hint_markdown=problem.hint_markdown,
        qr_token=problem.qr_token,
        sort_order=problem.sort_order,
        already_solved=solve is not None,
        solved_at=solve.solved_at if solve else None,
    )


async def submit_flag(
    db: AsyncSession,
    *,
    user: User,
    problem_id: uuid.UUID,
    payload: TreasureHuntFlagSubmit,
) -> TreasureHuntFlagSubmitRead:
    participant, team, _ = await get_team_context_for_user(db, user=user)
    problem = await crud.get_problem_by_id(db, problem_id=problem_id)
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    total_problems = await crud.count_active_problems(db)
    existing_solve = await crud.get_solve_by_team_and_problem(db, team_id=team.id, problem_id=problem.id)
    if existing_solve:
        progress = await _get_or_create_team_progress(db, team_id=team.id)
        return _build_submit_response(
            status_name="already_solved",
            correct=True,
            team_id=team.id,
            problem_id=problem.id,
            solved_count=progress.solved_count,
            total_problems=total_problems,
            completed_at=progress.completed_at,
            finish_rank=progress.finish_rank,
        )

    if not _is_correct_flag(problem.flag_hash, payload.flag):
        progress = await _get_or_create_team_progress(db, team_id=team.id)
        return _build_submit_response(
            status_name="incorrect",
            correct=False,
            team_id=team.id,
            problem_id=problem.id,
            solved_count=progress.solved_count,
            total_problems=total_problems,
            completed_at=progress.completed_at,
            finish_rank=progress.finish_rank,
        )

    existing_by_idem = await crud.get_solve_by_idempotency_key(
        db, idempotency_key=payload.idempotency_key
    )
    if existing_by_idem:
        if existing_by_idem.team_id != team.id or existing_by_idem.problem_id != problem.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="idempotency_key already exists for a different solve request",
            )
        progress = await _get_or_create_team_progress(db, team_id=team.id)
        return _build_submit_response(
            status_name="already_solved",
            correct=True,
            team_id=team.id,
            problem_id=problem.id,
            solved_count=progress.solved_count,
            total_problems=total_problems,
            completed_at=progress.completed_at,
            finish_rank=progress.finish_rank,
        )

    try:
        async with db.begin_nested():
            solve = await crud.create_solve(
                db,
                team_id=team.id,
                problem_id=problem.id,
                solved_by_participant_id=participant.id,
                idempotency_key=payload.idempotency_key,
            )
    except IntegrityError:
        existing_solve = await crud.get_solve_by_team_and_problem(
            db, team_id=team.id, problem_id=problem.id
        )
        if existing_solve:
            progress = await _get_or_create_team_progress(db, team_id=team.id)
            return _build_submit_response(
                status_name="already_solved",
                correct=True,
                team_id=team.id,
                problem_id=problem.id,
                solved_count=progress.solved_count,
                total_problems=total_problems,
                completed_at=progress.completed_at,
                finish_rank=progress.finish_rank,
            )
        existing_by_idem = await crud.get_solve_by_idempotency_key(
            db, idempotency_key=payload.idempotency_key
        )
        if existing_by_idem:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="idempotency_key already exists for a different solve request",
            )
        raise

    progress = await _lock_team_progress(db, team_id=team.id)
    progress.solved_count += 1
    progress.last_solved_at = solve.solved_at
    if progress.solved_count >= total_problems and progress.completed_at is None:
        progress.completed_at = solve.solved_at
        progress.finish_rank = await _claim_finish_rank(db, progress)
    progress = await crud.save_team_progress(db, progress=progress)

    return _build_submit_response(
        status_name="solved",
        correct=True,
        team_id=team.id,
        problem_id=problem.id,
        solved_count=progress.solved_count,
        total_problems=total_problems,
        completed_at=progress.completed_at,
        finish_rank=progress.finish_rank,
    )


async def get_my_progress(db: AsyncSession, *, user: User) -> TreasureHuntTeamProgressRead:
    _, team, _ = await get_team_context_for_user(db, user=user)
    progress = await _get_or_create_team_progress(db, team_id=team.id)
    total_problems = await crud.count_active_problems(db)
    leaderboard_rows = await crud.list_leaderboard_rows(db)
    statuses = await _build_problem_statuses(db, team_id=team.id)
    rank = _find_team_rank(leaderboard_rows, team.id)

    return TreasureHuntTeamProgressRead(
        team_id=team.id,
        team_name=team.name,
        solved_count=progress.solved_count,
        total_problems=total_problems,
        remaining_count=max(total_problems - progress.solved_count, 0),
        leaderboard_rank=rank,
        last_solved_at=progress.last_solved_at,
        completed_at=progress.completed_at,
        finish_rank=progress.finish_rank,
        problems=statuses,
    )


async def get_leaderboard(
    db: AsyncSession, *, skip: int = 0, limit: int = 50
) -> TreasureHuntLeaderboardRead:
    rows = await crud.list_leaderboard_rows(db)
    total_problems = await crud.count_active_problems(db)
    sliced = rows[skip : skip + limit]
    entries = [
        TreasureHuntLeaderboardEntryRead(
            rank=skip + index + 1,
            team_id=row[0],
            team_name=row[1],
            solved_count=row[2],
            total_problems=total_problems,
            last_solved_at=row[3],
            completed_at=row[4],
            finish_rank=row[5],
        )
        for index, row in enumerate(sliced)
    ]
    return TreasureHuntLeaderboardRead(total_teams=len(rows), entries=entries)


async def get_finishers(db: AsyncSession) -> TreasureHuntLeaderboardRead:
    rows = await crud.list_finishers(db)
    total_problems = await crud.count_active_problems(db)
    entries = [
        TreasureHuntLeaderboardEntryRead(
            rank=index + 1,
            team_id=row[0],
            team_name=row[1],
            solved_count=row[2],
            total_problems=total_problems,
            last_solved_at=row[3],
            completed_at=row[4],
            finish_rank=row[5],
        )
        for index, row in enumerate(rows)
    ]
    return TreasureHuntLeaderboardRead(total_teams=len(entries), entries=entries)


async def _build_problem_statuses(
    db: AsyncSession, *, team_id: uuid.UUID
) -> list[TreasureHuntProblemStatusRead]:
    problems = await crud.list_active_problems(db)
    solves = await crud.list_team_solves(db, team_id=team_id)
    solve_by_problem_id = {solve.problem_id: solve for solve in solves}
    return [
        TreasureHuntProblemStatusRead(
            problem_id=problem.id,
            slug=problem.slug,
            title=problem.title,
            sort_order=problem.sort_order,
            solved=problem.id in solve_by_problem_id,
            solved_at=solve_by_problem_id[problem.id].solved_at if problem.id in solve_by_problem_id else None,
        )
        for problem in problems
    ]


async def _get_or_create_team_progress(
    db: AsyncSession, *, team_id: uuid.UUID
) -> TreasureHuntTeamProgress:
    progress = await crud.get_team_progress(db, team_id=team_id)
    if progress:
        return progress
    try:
        return await crud.create_team_progress(db, team_id=team_id)
    except IntegrityError:
        progress = await crud.get_team_progress(db, team_id=team_id)
        if progress:
            return progress
        raise


async def _lock_team_progress(
    db: AsyncSession, *, team_id: uuid.UUID
) -> TreasureHuntTeamProgress:
    progress = await crud.get_team_progress_for_update(db, team_id=team_id)
    if progress:
        return progress
    await _get_or_create_team_progress(db, team_id=team_id)
    progress = await crud.get_team_progress_for_update(db, team_id=team_id)
    if not progress:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not lock team progress")
    return progress


async def _claim_finish_rank(
    db: AsyncSession, progress: TreasureHuntTeamProgress
) -> int | None:
    for candidate in range(1, MAX_FINISHERS + 1):
        try:
            async with db.begin_nested():
                progress.finish_rank = candidate
                await crud.save_team_progress(db, progress=progress)
            return candidate
        except IntegrityError:
            progress.finish_rank = None
            continue
    progress.finish_rank = None
    return None


def _is_correct_flag(expected_hash: str, submitted_flag: str) -> bool:
    normalized = submitted_flag.strip().lower().encode("utf-8")
    digest = hashlib.sha256(normalized).hexdigest()
    return hmac.compare_digest(expected_hash, digest)


def _find_team_rank(
    rows: list[tuple[uuid.UUID, str, int, object, object, object]], team_id: uuid.UUID
) -> int:
    for index, row in enumerate(rows, start=1):
        if row[0] == team_id:
            return index
    return len(rows) + 1


def _build_submit_response(
    *,
    status_name: str,
    correct: bool,
    team_id: uuid.UUID,
    problem_id: uuid.UUID,
    solved_count: int,
    total_problems: int,
    completed_at,
    finish_rank,
) -> TreasureHuntFlagSubmitRead:
    return TreasureHuntFlagSubmitRead(
        correct=correct,
        status=status_name,
        team_id=team_id,
        problem_id=problem_id,
        solved_count=solved_count,
        total_problems=total_problems,
        completed_at=completed_at,
        finish_rank=finish_rank,
    )
