import uuid
from datetime import datetime
from typing import Optional

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class ShopItemCreate(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=2000)
    point_cost: int = Field(ge=1)
    stock: Optional[int] = Field(default=None, ge=0)
    photo_key: Optional[str] = Field(default=None, max_length=500)

    @field_validator("name", "description")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("value must not be blank")
        return trimmed

    @field_validator("photo_key")
    @classmethod
    def validate_photo_key(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


class ShopItemUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, min_length=1, max_length=2000)
    point_cost: Optional[int] = Field(default=None, ge=1)
    stock: Optional[int] = Field(default=None, ge=0)
    is_active: Optional[bool] = None
    photo_key: Optional[str] = Field(default=None, max_length=500)

    @field_validator("name", "description")
    @classmethod
    def validate_optional_required_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("value must not be blank")
        return trimmed

    @field_validator("photo_key")
    @classmethod
    def validate_optional_photo_key(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


class ShopItemRead(SQLModel):
    id: uuid.UUID
    name: str
    description: str
    point_cost: int
    stock: Optional[int]
    remaining_stock: Optional[int]
    is_active: bool
    photo_key: Optional[str]
    created_at: datetime
    updated_at: datetime
