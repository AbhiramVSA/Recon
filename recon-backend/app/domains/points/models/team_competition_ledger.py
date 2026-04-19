import uuid
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.utils.models.base import Base


class TeamCompetitionLedgerBase(SQLModel):
    team_id: uuid.UUID = Field(foreign_key="teams.id", index=True)
    event_key: str = Field(max_length=50, index=True)
    round_key: str = Field(default="default", max_length=80, index=True)
    mutation_type: str = Field(max_length=20)
    raw_score_delta: int
    normalized_points_delta: int
    resulting_raw_score: int = Field(ge=0)
    resulting_normalized_points: int = Field(ge=0)
    raw_score_ceiling: int = Field(ge=1)
    normalized_points_ceiling: int = Field(ge=1)
    source: str = Field(max_length=120)
    source_reference: str | None = Field(default=None, max_length=160)
    idempotency_key: str = Field(max_length=100, index=True, unique=True)
    note: str | None = Field(default=None, max_length=300)
    details_json: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))


class TeamCompetitionLedger(Base, TeamCompetitionLedgerBase, table=True):
    __tablename__ = "team_competition_ledger"

    recorded_by_user_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="users.id",
        index=True,
    )
