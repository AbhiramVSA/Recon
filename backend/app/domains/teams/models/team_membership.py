import uuid

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel

from app.utils.models.base import Base


class TeamMembershipBase(SQLModel):
    team_id: uuid.UUID = Field(foreign_key="teams.id", index=True)
    participant_id: uuid.UUID = Field(foreign_key="participants.id", unique=True, index=True)


class TeamMembership(Base, TeamMembershipBase, table=True):
    __tablename__ = "team_memberships"
    __table_args__ = (
        UniqueConstraint("team_id", "participant_id", name="uq_team_memberships_team_participant"),
    )
