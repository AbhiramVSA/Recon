"""split zone registration and check-in points

Revision ID: f0a1b2c3d4e6
Revises: e8f9a0b1c2d3
Create Date: 2026-04-19 23:25:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f0a1b2c3d4e6"
down_revision: Union[str, Sequence[str], None] = "e8f9a0b1c2d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "zones",
        sa.Column("registration_required", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "zones",
        sa.Column("registration_points", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "zones",
        sa.Column("check_in_points", sa.Integer(), nullable=False, server_default="0"),
    )

    op.execute(
        """
        UPDATE zones
        SET registration_required = TRUE,
            registration_points = COALESCE(points, 0),
            check_in_points = 0
        """
    )

    op.execute(
        """
        UPDATE zones
        SET registration_required = TRUE,
            registration_points = 100,
            check_in_points = 0,
            points = 100
        WHERE lower(short_name) IN ('arena', 'appsec', 'nfc', 'forensics', 'hardware')
        """
    )

    op.execute(
        """
        UPDATE zones
        SET registration_required = TRUE,
            registration_points = 50,
            check_in_points = 0,
            points = 50
        WHERE lower(short_name) = 'expo'
        """
    )

    op.execute(
        """
        UPDATE zones
        SET registration_required = FALSE,
            registration_points = 0,
            check_in_points = 0,
            points = 0
        WHERE lower(short_name) IN ('art', 'gaming')
        """
    )

    op.create_index(
        "uq_point_ledger_zone_event_registration_reason_reference",
        "point_ledger",
        ["participant_id", "reference_id"],
        unique=True,
        postgresql_where=sa.text(
            "reason = 'zone.event_registration' AND reference_id IS NOT NULL"
        ),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_point_ledger_zone_event_registration_reason_reference",
        table_name="point_ledger",
    )
    op.drop_column("zones", "check_in_points")
    op.drop_column("zones", "registration_points")
    op.drop_column("zones", "registration_required")
