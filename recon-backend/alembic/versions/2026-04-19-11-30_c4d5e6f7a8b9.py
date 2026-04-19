"""add team settlement and admin team controls

Revision ID: c4d5e6f7a8b9
Revises: b6e7f8a9c1d2
Create Date: 2026-04-19 11:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, Sequence[str], None] = "b6e7f8a9c1d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "participants",
        sa.Column(
            "team_self_service_locked",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.create_index(
        op.f("ix_participants_team_self_service_locked"),
        "participants",
        ["team_self_service_locked"],
        unique=False,
    )
    op.alter_column("teams", "created_by_participant_id", existing_type=sa.Uuid(), nullable=True)

    op.create_table(
        "team_competition_settlements",
        sa.Column("team_id", sa.Uuid(), nullable=False),
        sa.Column("event_key", sa.String(length=50), nullable=False),
        sa.Column("round_key", sa.String(length=80), nullable=False, server_default="default"),
        sa.Column("participant_points_budget", sa.Integer(), nullable=False),
        sa.Column("source_raw_score_total", sa.Integer(), nullable=False),
        sa.Column("source_raw_score_ceiling", sa.Integer(), nullable=False),
        sa.Column("source_normalized_points_total", sa.Integer(), nullable=False),
        sa.Column("source_normalized_points_ceiling", sa.Integer(), nullable=False),
        sa.Column("allocation_mode", sa.String(length=40), nullable=False, server_default="equal_split"),
        sa.Column("settled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("idempotency_key", sa.String(length=100), nullable=False),
        sa.Column("note", sa.String(length=300), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("settled_by_user_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["settled_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("idempotency_key"),
        sa.UniqueConstraint(
            "team_id",
            "event_key",
            "round_key",
            name="uq_team_comp_settlements_team_event_round",
        ),
    )
    op.create_index(
        op.f("ix_team_competition_settlements_event_key"),
        "team_competition_settlements",
        ["event_key"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_settlements_id"),
        "team_competition_settlements",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_settlements_idempotency_key"),
        "team_competition_settlements",
        ["idempotency_key"],
        unique=True,
    )
    op.create_index(
        op.f("ix_team_competition_settlements_round_key"),
        "team_competition_settlements",
        ["round_key"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_settlements_settled_by_user_id"),
        "team_competition_settlements",
        ["settled_by_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_settlements_team_id"),
        "team_competition_settlements",
        ["team_id"],
        unique=False,
    )

    op.create_table(
        "team_competition_settlement_allocations",
        sa.Column("settlement_id", sa.Uuid(), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("allocated_points", sa.Integer(), nullable=False),
        sa.Column("point_ledger_entry_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["participants.id"]),
        sa.ForeignKeyConstraint(["point_ledger_entry_id"], ["point_ledger.id"]),
        sa.ForeignKeyConstraint(["settlement_id"], ["team_competition_settlements.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "settlement_id",
            "participant_id",
            name="uq_team_comp_settlement_allocations_settlement_participant",
        ),
    )
    op.create_index(
        op.f("ix_team_competition_settlement_allocations_id"),
        "team_competition_settlement_allocations",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_settlement_allocations_participant_id"),
        "team_competition_settlement_allocations",
        ["participant_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_competition_settlement_allocations_point_ledger_entry_id"),
        "team_competition_settlement_allocations",
        ["point_ledger_entry_id"],
        unique=True,
    )
    op.create_index(
        op.f("ix_team_competition_settlement_allocations_settlement_id"),
        "team_competition_settlement_allocations",
        ["settlement_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_team_competition_settlement_allocations_settlement_id"),
        table_name="team_competition_settlement_allocations",
    )
    op.drop_index(
        op.f("ix_team_competition_settlement_allocations_point_ledger_entry_id"),
        table_name="team_competition_settlement_allocations",
    )
    op.drop_index(
        op.f("ix_team_competition_settlement_allocations_participant_id"),
        table_name="team_competition_settlement_allocations",
    )
    op.drop_index(
        op.f("ix_team_competition_settlement_allocations_id"),
        table_name="team_competition_settlement_allocations",
    )
    op.drop_table("team_competition_settlement_allocations")

    op.drop_index(
        op.f("ix_team_competition_settlements_team_id"),
        table_name="team_competition_settlements",
    )
    op.drop_index(
        op.f("ix_team_competition_settlements_settled_by_user_id"),
        table_name="team_competition_settlements",
    )
    op.drop_index(
        op.f("ix_team_competition_settlements_round_key"),
        table_name="team_competition_settlements",
    )
    op.drop_index(
        op.f("ix_team_competition_settlements_idempotency_key"),
        table_name="team_competition_settlements",
    )
    op.drop_index(
        op.f("ix_team_competition_settlements_id"),
        table_name="team_competition_settlements",
    )
    op.drop_index(
        op.f("ix_team_competition_settlements_event_key"),
        table_name="team_competition_settlements",
    )
    op.drop_table("team_competition_settlements")

    op.alter_column("teams", "created_by_participant_id", existing_type=sa.Uuid(), nullable=False)
    op.drop_index(op.f("ix_participants_team_self_service_locked"), table_name="participants")
    op.drop_column("participants", "team_self_service_locked")
