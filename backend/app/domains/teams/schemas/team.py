import uuid
from datetime import datetime

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class TeamCreate(SQLModel):
    name: str = Field(min_length=3, max_length=80)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        if len(cleaned) < 3:
            raise ValueError("name must be at least 3 characters")
        return cleaned


class TeamJoin(SQLModel):
    invite_code: str = Field(min_length=4, max_length=16)

    @field_validator("invite_code")
    @classmethod
    def normalize_invite_code(cls, value: str) -> str:
        cleaned = value.strip().upper()
        if not cleaned:
            raise ValueError("invite_code must not be blank")
        return cleaned


class TeamMemberRead(SQLModel):
    participant_id: uuid.UUID
    display_name: str
    joined_at: datetime


class TeamRead(SQLModel):
    id: uuid.UUID
    name: str
    invite_code: str
    created_by_participant_id: uuid.UUID
    created_at: datetime
    members: list[TeamMemberRead]
