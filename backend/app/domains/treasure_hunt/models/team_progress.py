import uuid
from datetime import datetime

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel

from app.utils.models.base import Base


class TreasureHuntTeamProgressBase(SQLModel):
    team_id: uuid.UUID = Field(foreign_key="teams.id", unique=True, index=True)
    solved_count: int = Field(default=0, ge=0)
    last_solved_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    completed_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True), index=True)
    finish_rank: int | None = Field(default=None, unique=True, index=True)


class TreasureHuntTeamProgress(Base, TreasureHuntTeamProgressBase, table=True):
    __tablename__ = "treasure_hunt_team_progress"
