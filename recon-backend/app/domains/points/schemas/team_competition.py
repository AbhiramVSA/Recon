import datetime
import uuid
from typing import Any

from sqlmodel import Field, SQLModel


class TeamCompetitionRuleRead(SQLModel):
    event_key: str
    display_name: str
    default_raw_score_ceiling: int | None = None
    default_normalized_points_ceiling: int
    supports_snapshot_ingest: bool
    supports_delta_awards: bool
    note: str


class TeamCompetitionRulesRead(SQLModel):
    rules: list[TeamCompetitionRuleRead]


class TeamCompetitionAwardDeltaCreate(SQLModel):
    team_id: uuid.UUID
    event_key: str = Field(max_length=50)
    round_key: str = Field(default="default", min_length=1, max_length=80)
    raw_score_delta: int = Field(description="Signed team score delta. Negative values are penalties.")
    raw_score_ceiling: int | None = Field(default=None, ge=1)
    normalized_points_ceiling: int | None = Field(default=None, ge=1)
    source: str = Field(max_length=120)
    source_reference: str | None = Field(default=None, max_length=160)
    idempotency_key: str = Field(min_length=1, max_length=100)
    note: str | None = Field(default=None, max_length=300)
    details_json: dict[str, Any] | None = None


class TeamCompetitionSnapshotIngestCreate(SQLModel):
    team_id: uuid.UUID
    event_key: str = Field(max_length=50)
    round_key: str = Field(default="default", min_length=1, max_length=80)
    raw_score_total: int = Field(ge=0)
    raw_score_ceiling: int | None = Field(default=None, ge=1)
    normalized_points_ceiling: int | None = Field(default=None, ge=1)
    source: str = Field(max_length=120)
    source_reference: str | None = Field(default=None, max_length=160)
    idempotency_key: str = Field(min_length=1, max_length=100)
    note: str | None = Field(default=None, max_length=300)
    details_json: dict[str, Any] | None = None


class TeamCompetitionTransactionRead(SQLModel):
    id: uuid.UUID
    team_id: uuid.UUID
    event_key: str
    round_key: str
    mutation_type: str
    raw_score_delta: int
    normalized_points_delta: int
    resulting_raw_score: int
    resulting_normalized_points: int
    raw_score_ceiling: int
    normalized_points_ceiling: int
    source: str
    source_reference: str | None = None
    idempotency_key: str
    note: str | None = None
    details_json: dict[str, Any] | None = None
    recorded_by_user_id: uuid.UUID | None = None
    created_at: datetime.datetime


class TeamCompetitionRoundScoreRead(SQLModel):
    team_id: uuid.UUID
    event_key: str
    round_key: str
    raw_score_total: int
    raw_score_ceiling: int
    normalized_points_total: int
    normalized_points_ceiling: int
    last_activity_at: datetime.datetime | None = None


class TeamCompetitionAwardRead(SQLModel):
    transaction: TeamCompetitionTransactionRead
    round_score: TeamCompetitionRoundScoreRead


class TeamCompetitionLeaderboardEntryRead(SQLModel):
    rank: int
    team_id: uuid.UUID
    team_name: str
    normalized_points: int
    last_activity_at: datetime.datetime | None = None


class TeamCompetitionLeaderboardPageRead(SQLModel):
    event_key: str | None = None
    total_ranked: int
    skip: int
    limit: int
    entries: list[TeamCompetitionLeaderboardEntryRead]


class TeamCompetitionEventSummaryRead(SQLModel):
    event_key: str
    normalized_points: int
    raw_score_total: int


class TeamCompetitionMeRead(SQLModel):
    team_id: uuid.UUID
    team_name: str
    rank: int | None = None
    total_ranked: int
    normalized_points: int
    event_summaries: list[TeamCompetitionEventSummaryRead]
    rounds: list[TeamCompetitionRoundScoreRead]


class TeamCompetitionSettlementPreviewCreate(SQLModel):
    team_id: uuid.UUID
    event_key: str = Field(max_length=50)
    round_key: str = Field(default="default", min_length=1, max_length=80)
    participant_points_budget: int = Field(ge=0)
    note: str | None = Field(default=None, max_length=300)


class TeamCompetitionSettlementFinalizeCreate(SQLModel):
    team_id: uuid.UUID
    event_key: str = Field(max_length=50)
    round_key: str = Field(default="default", min_length=1, max_length=80)
    participant_points_budget: int = Field(ge=0)
    idempotency_key: str = Field(min_length=1, max_length=100)
    note: str | None = Field(default=None, max_length=300)


class TeamCompetitionSettlementAllocationRead(SQLModel):
    participant_id: uuid.UUID
    display_name: str
    allocated_points: int


class TeamCompetitionSettlementPreviewRead(SQLModel):
    team_id: uuid.UUID
    team_name: str
    event_key: str
    round_key: str
    allocation_mode: str
    member_count: int
    participant_points_budget: int
    source_raw_score_total: int
    source_raw_score_ceiling: int
    source_normalized_points_total: int
    source_normalized_points_ceiling: int
    allocations: list[TeamCompetitionSettlementAllocationRead]
    note: str | None = None


class TeamCompetitionSettlementRead(SQLModel):
    id: uuid.UUID
    team_id: uuid.UUID
    team_name: str
    event_key: str
    round_key: str
    allocation_mode: str
    participant_points_budget: int
    source_raw_score_total: int
    source_raw_score_ceiling: int
    source_normalized_points_total: int
    source_normalized_points_ceiling: int
    settled_at: datetime.datetime
    settled_by_user_id: uuid.UUID
    idempotency_key: str
    note: str | None = None
    allocations: list[TeamCompetitionSettlementAllocationRead]


class TeamCompetitionSettlementListRead(SQLModel):
    settlements: list[TeamCompetitionSettlementRead]
