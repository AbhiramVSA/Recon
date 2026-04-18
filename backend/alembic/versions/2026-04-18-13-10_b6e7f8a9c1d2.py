"""add team competition scoring tables

Revision ID: b6e7f8a9c1d2
Revises: 18db06de1e12
Create Date: 2026-04-18 13:10:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b6e7f8a9c1d2"
down_revision: Union[str, Sequence[str], None] = "18db06de1e12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "team_competition_round_scores",
        sa.Column("team_id", sa.Uuid(), nullable=False),
        sa.Column("event_key", sa.String(length=50), nullable=False),
        sa.Column("round_key", sa.String(length=80), nullable=False, server_default="default"),
        sa.Column("raw_score_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("raw_score_ceiling", sa.Integer(), nullable=False),
        sa.Column("normalized_points_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("normalized_points_ceiling", sa.Integer(), nullable=False),
        sa.Column("last_activity_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("team_id", "event_key", "round_key", name="uq_team_comp_round"),
    )
    op.create_index(
        op.f("ix_team_competition_round_scores_event_key"),
        "team_competition_round_scores",
        ["event_key"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_round_scores_id"),
        "team_competition_round_scores",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_round_scores_round_key"),
        "team_competition_round_scores",
        ["round_key"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_round_scores_team_id"),
        "team_competition_round_scores",
        ["team_id"],
        unique=False,
    )

    op.create_table(
        "team_competition_ledger",
        sa.Column("team_id", sa.Uuid(), nullable=False),
        sa.Column("event_key", sa.String(length=50), nullable=False),
        sa.Column("round_key", sa.String(length=80), nullable=False, server_default="default"),
        sa.Column("mutation_type", sa.String(length=20), nullable=False),
        sa.Column("raw_score_delta", sa.Integer(), nullable=False),
        sa.Column("normalized_points_delta", sa.Integer(), nullable=False),
        sa.Column("resulting_raw_score", sa.Integer(), nullable=False),
        sa.Column("resulting_normalized_points", sa.Integer(), nullable=False),
        sa.Column("raw_score_ceiling", sa.Integer(), nullable=False),
        sa.Column("normalized_points_ceiling", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=120), nullable=False),
        sa.Column("source_reference", sa.String(length=160), nullable=True),
        sa.Column("idempotency_key", sa.String(length=100), nullable=False),
        sa.Column("note", sa.String(length=300), nullable=True),
        sa.Column("details_json", sa.JSON(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("recorded_by_user_id", sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(["recorded_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_team_competition_ledger_event_key"),
        "team_competition_ledger",
        ["event_key"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_ledger_id"),
        "team_competition_ledger",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_ledger_idempotency_key"),
        "team_competition_ledger",
        ["idempotency_key"],
        unique=True,
    )
    op.create_index(
        op.f("ix_team_competition_ledger_recorded_by_user_id"),
        "team_competition_ledger",
        ["recorded_by_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_ledger_round_key"),
        "team_competition_ledger",
        ["round_key"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_ledger_team_id"),
        "team_competition_ledger",
        ["team_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_team_competition_ledger_team_id"), table_name="team_competition_ledger")
    op.drop_index(op.f("ix_team_competition_ledger_round_key"), table_name="team_competition_ledger")
    op.drop_index(op.f("ix_team_competition_ledger_recorded_by_user_id"), table_name="team_competition_ledger")
    op.drop_index(op.f("ix_team_competition_ledger_idempotency_key"), table_name="team_competition_ledger")
    op.drop_index(op.f("ix_team_competition_ledger_id"), table_name="team_competition_ledger")
    op.drop_index(op.f("ix_team_competition_ledger_event_key"), table_name="team_competition_ledger")
    op.drop_table("team_competition_ledger")

    op.drop_index(op.f("ix_team_competition_round_scores_team_id"), table_name="team_competition_round_scores")
    op.drop_index(op.f("ix_team_competition_round_scores_round_key"), table_name="team_competition_round_scores")
    op.drop_index(op.f("ix_team_competition_round_scores_id"), table_name="team_competition_round_scores")
    op.drop_index(op.f("ix_team_competition_round_scores_event_key"), table_name="team_competition_round_scores")
    op.drop_table("team_competition_round_scores")
