import uuid
from datetime import datetime
from typing import Literal

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class TreasureHuntProblemRead(SQLModel):
    id: uuid.UUID
    slug: str
    title: str
    teaser: str
    body_markdown: str
    hint_markdown: str | None
    qr_token: str
    route_hash: str
    sort_order: int
    already_solved: bool
    solved_at: datetime | None


class TreasureHuntProblemStatusRead(SQLModel):
    problem_id: uuid.UUID
    slug: str
    title: str
    route_hash: str
    sort_order: int
    solved: bool
    solved_at: datetime | None


class TreasureHuntFlagSubmit(SQLModel):
    flag: str = Field(min_length=1, max_length=200)
    idempotency_key: str = Field(min_length=1, max_length=120)

    @field_validator("flag")
    @classmethod
    def validate_flag(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("flag must not be blank")
        return cleaned

    @field_validator("idempotency_key")
    @classmethod
    def validate_idempotency_key(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("idempotency_key must not be blank")
        return cleaned


class TreasureHuntFlagSubmitRead(SQLModel):
    correct: bool
    status: Literal["incorrect", "solved", "already_solved"]
    team_id: uuid.UUID
    problem_id: uuid.UUID
    next_hint: str | None = None
    solved_count: int
    total_problems: int
    completed_at: datetime | None
    finish_rank: int | None


class TreasureHuntLeaderboardEntryRead(SQLModel):
    rank: int
    team_id: uuid.UUID
    team_name: str
    solved_count: int
    total_problems: int
    last_solved_at: datetime | None
    completed_at: datetime | None
    finish_rank: int | None


class TreasureHuntLeaderboardRead(SQLModel):
    total_teams: int
    entries: list[TreasureHuntLeaderboardEntryRead]


class TreasureHuntTeamProgressRead(SQLModel):
    team_id: uuid.UUID
    team_name: str
    solved_count: int
    total_problems: int
    remaining_count: int
    leaderboard_rank: int
    last_solved_at: datetime | None
    completed_at: datetime | None
    finish_rank: int | None
    problems: list[TreasureHuntProblemStatusRead]
