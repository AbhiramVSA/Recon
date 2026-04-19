from sqlmodel import Field, SQLModel

from app.utils.models.base import Base


class TreasureHuntProblemBase(SQLModel):
    slug: str = Field(max_length=80, unique=True, index=True)
    title: str = Field(max_length=120)
    teaser: str = Field(max_length=200)
    body_markdown: str = Field(max_length=4000)
    hint_markdown: str | None = Field(default=None, max_length=1000)
    qr_token: str = Field(max_length=120, unique=True, index=True)
    flag_hash: str = Field(max_length=64)
    sort_order: int = Field(index=True)
    is_active: bool = Field(default=True, index=True)


class TreasureHuntProblem(Base, TreasureHuntProblemBase, table=True):
    __tablename__ = "treasure_hunt_problems"
