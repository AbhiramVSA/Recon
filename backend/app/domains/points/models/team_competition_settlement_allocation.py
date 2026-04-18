import uuid

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel

from app.utils.models.base import Base


class TeamCompetitionSettlementAllocationBase(SQLModel):
    settlement_id: uuid.UUID = Field(
        foreign_key="team_competition_settlements.id",
        index=True,
    )
    participant_id: uuid.UUID = Field(foreign_key="participants.id", index=True)
    allocated_points: int = Field(ge=0)
    point_ledger_entry_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="point_ledger.id",
        unique=True,
        index=True,
    )


class TeamCompetitionSettlementAllocation(
    Base, TeamCompetitionSettlementAllocationBase, table=True
):
    __tablename__ = "team_competition_settlement_allocations"
    __table_args__ = (
        UniqueConstraint(
            "settlement_id",
            "participant_id",
            name="uq_team_comp_settlement_allocations_settlement_participant",
        ),
    )
