"""add zone qr check-in scan idempotency

Revision ID: e8f9a0b1c2d3
Revises: d7e8f9a0b1c2
Create Date: 2026-04-19 20:58:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8f9a0b1c2d3"
down_revision: Union[str, Sequence[str], None] = "d7e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "zone_registrations",
        sa.Column("qr_jti", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "zone_registrations",
        sa.Column("qr_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(
        """
        UPDATE zone_registrations
        SET qr_jti = md5(id::text || '-zone-qr'),
            qr_expires_at = now() + interval '12 hours'
        WHERE qr_jti IS NULL OR qr_expires_at IS NULL
        """
    )
    op.alter_column("zone_registrations", "qr_jti", nullable=False)
    op.alter_column("zone_registrations", "qr_expires_at", nullable=False)
    op.create_index(op.f("ix_zone_registrations_qr_jti"), "zone_registrations", ["qr_jti"], unique=True)
    op.create_index(
        "uq_point_ledger_zone_check_in_reason_reference",
        "point_ledger",
        ["participant_id", "reference_id"],
        unique=True,
        postgresql_where=sa.text("reason = 'zone.event_check_in' AND reference_id IS NOT NULL"),
    )

    op.create_table(
        "zone_check_ins",
        sa.Column("registration_id", sa.Uuid(), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("zone_id", sa.Uuid(), nullable=False),
        sa.Column("checked_in_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("scanner_device_id", sa.String(length=80), nullable=False),
        sa.Column("scanned_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("points_awarded", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("resulting_balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("point_ledger_entry_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["checked_in_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["participant_id"], ["participants.id"]),
        sa.ForeignKeyConstraint(["point_ledger_entry_id"], ["point_ledger.id"]),
        sa.ForeignKeyConstraint(["registration_id"], ["zone_registrations.id"]),
        sa.ForeignKeyConstraint(["zone_id"], ["zones.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("point_ledger_entry_id", name="uq_zone_check_ins_point_ledger_entry"),
        sa.UniqueConstraint("registration_id", name="uq_zone_check_ins_registration"),
    )
    op.create_index(op.f("ix_zone_check_ins_checked_in_by_user_id"), "zone_check_ins", ["checked_in_by_user_id"], unique=False)
    op.create_index(op.f("ix_zone_check_ins_id"), "zone_check_ins", ["id"], unique=False)
    op.create_index(op.f("ix_zone_check_ins_participant_id"), "zone_check_ins", ["participant_id"], unique=False)
    op.create_index(op.f("ix_zone_check_ins_point_ledger_entry_id"), "zone_check_ins", ["point_ledger_entry_id"], unique=True)
    op.create_index(op.f("ix_zone_check_ins_registration_id"), "zone_check_ins", ["registration_id"], unique=False)
    op.create_index(op.f("ix_zone_check_ins_scanner_device_id"), "zone_check_ins", ["scanner_device_id"], unique=False)
    op.create_index(op.f("ix_zone_check_ins_zone_id"), "zone_check_ins", ["zone_id"], unique=False)

    op.create_table(
        "zone_scan_requests",
        sa.Column("idempotency_key", sa.String(length=120), nullable=False),
        sa.Column("request_fingerprint", sa.String(length=64), nullable=False),
        sa.Column("scanner_user_id", sa.Uuid(), nullable=False),
        sa.Column("registration_id", sa.Uuid(), nullable=True),
        sa.Column("response_status_code", sa.Integer(), nullable=False),
        sa.Column("response_payload", sa.JSON(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["registration_id"], ["zone_registrations.id"]),
        sa.ForeignKeyConstraint(["scanner_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("idempotency_key", name="uq_zone_scan_requests_idempotency_key"),
    )
    op.create_index(op.f("ix_zone_scan_requests_id"), "zone_scan_requests", ["id"], unique=False)
    op.create_index(op.f("ix_zone_scan_requests_idempotency_key"), "zone_scan_requests", ["idempotency_key"], unique=False)
    op.create_index(op.f("ix_zone_scan_requests_registration_id"), "zone_scan_requests", ["registration_id"], unique=False)
    op.create_index(op.f("ix_zone_scan_requests_scanner_user_id"), "zone_scan_requests", ["scanner_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_zone_scan_requests_scanner_user_id"), table_name="zone_scan_requests")
    op.drop_index(op.f("ix_zone_scan_requests_registration_id"), table_name="zone_scan_requests")
    op.drop_index(op.f("ix_zone_scan_requests_idempotency_key"), table_name="zone_scan_requests")
    op.drop_index(op.f("ix_zone_scan_requests_id"), table_name="zone_scan_requests")
    op.drop_table("zone_scan_requests")

    op.drop_index(op.f("ix_zone_check_ins_zone_id"), table_name="zone_check_ins")
    op.drop_index(op.f("ix_zone_check_ins_scanner_device_id"), table_name="zone_check_ins")
    op.drop_index(op.f("ix_zone_check_ins_registration_id"), table_name="zone_check_ins")
    op.drop_index(op.f("ix_zone_check_ins_point_ledger_entry_id"), table_name="zone_check_ins")
    op.drop_index(op.f("ix_zone_check_ins_participant_id"), table_name="zone_check_ins")
    op.drop_index(op.f("ix_zone_check_ins_id"), table_name="zone_check_ins")
    op.drop_index(op.f("ix_zone_check_ins_checked_in_by_user_id"), table_name="zone_check_ins")
    op.drop_table("zone_check_ins")

    op.drop_index(
        "uq_point_ledger_zone_check_in_reason_reference",
        table_name="point_ledger",
    )
    op.drop_index(op.f("ix_zone_registrations_qr_jti"), table_name="zone_registrations")
    op.drop_column("zone_registrations", "qr_expires_at")
    op.drop_column("zone_registrations", "qr_jti")
