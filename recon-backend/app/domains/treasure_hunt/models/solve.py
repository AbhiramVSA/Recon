import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel

from app.utils.models.base import Base


class TreasureHuntSolveBase(SQLModel):
    team_id: uuid.UUID = Field(foreign_key="teams.id", index=True)
    problem_id: uuid.UUID = Field(foreign_key="treasure_hunt_problems.id", index=True)
    solved_by_participant_id: uuid.UUID = Field(foreign_key="participants.id", index=True)
    idempotency_key: str = Field(max_length=120, unique=True, index=True)


class TreasureHuntSolve(Base, TreasureHuntSolveBase, table=True):
    __tablename__ = "treasure_hunt_solves"
    __table_args__ = (
        UniqueConstraint("team_id", "problem_id", name="uq_treasure_hunt_solves_team_problem"),
    )

    solved_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )
