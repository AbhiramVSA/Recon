import uuid

from sqlmodel import Field, SQLModel

from app.utils.models.base import Base


class TeamBase(SQLModel):
    name: str = Field(max_length=80, unique=True, index=True)
    invite_code: str = Field(max_length=16, unique=True, index=True)


class Team(Base, TeamBase, table=True):
    __tablename__ = "teams"

    created_by_participant_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="participants.id",
        index=True,
    )
