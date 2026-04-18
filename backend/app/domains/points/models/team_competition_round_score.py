import uuid
from datetime import datetime

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel

from app.utils.models.base import Base


class TeamCompetitionRoundScoreBase(SQLModel):
    team_id: uuid.UUID = Field(foreign_key="teams.id", index=True)
    event_key: str = Field(max_length=50, index=True)
    round_key: str = Field(default="default", max_length=80, index=True)
    raw_score_total: int = Field(default=0, ge=0)
    raw_score_ceiling: int = Field(ge=1)
    normalized_points_total: int = Field(default=0, ge=0)
    normalized_points_ceiling: int = Field(ge=1)
    last_activity_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))


class TeamCompetitionRoundScore(Base, TeamCompetitionRoundScoreBase, table=True):
    __tablename__ = "team_competition_round_scores"
    __table_args__ = (
        UniqueConstraint("team_id", "event_key", "round_key", name="uq_team_comp_round"),
    )
