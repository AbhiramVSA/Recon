import uuid
from datetime import datetime

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel

from app.utils.models.base import Base


class TeamCompetitionSettlementBase(SQLModel):
    team_id: uuid.UUID = Field(foreign_key="teams.id", index=True)
    event_key: str = Field(max_length=50, index=True)
    round_key: str = Field(default="default", max_length=80, index=True)
    participant_points_budget: int = Field(ge=0)
    source_raw_score_total: int = Field(ge=0)
    source_raw_score_ceiling: int = Field(ge=1)
    source_normalized_points_total: int = Field(ge=0)
    source_normalized_points_ceiling: int = Field(ge=1)
    allocation_mode: str = Field(default="equal_split", max_length=40)
    settled_at: datetime = Field(sa_type=DateTime(timezone=True))
    idempotency_key: str = Field(max_length=100, unique=True, index=True)
    note: str | None = Field(default=None, max_length=300)


class TeamCompetitionSettlement(Base, TeamCompetitionSettlementBase, table=True):
    __tablename__ = "team_competition_settlements"
    __table_args__ = (
        UniqueConstraint(
            "team_id",
            "event_key",
            "round_key",
            name="uq_team_comp_settlements_team_event_round",
        ),
    )

    settled_by_user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
