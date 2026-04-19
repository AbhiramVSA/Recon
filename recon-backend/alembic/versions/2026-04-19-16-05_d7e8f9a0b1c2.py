"""add shop redemption return tracking and snapshots

Revision ID: d7e8f9a0b1c2
Revises: c4d5e6f7a8b9
Create Date: 2026-04-19 16:05:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d7e8f9a0b1c2"
down_revision: Union[str, Sequence[str], None] = "c4d5e6f7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("redemptions", sa.Column("item_name_snapshot", sa.String(length=100), nullable=True))
    op.add_column("redemptions", sa.Column("point_cost_snapshot", sa.Integer(), nullable=True))
    op.add_column("redemptions", sa.Column("return_notes", sa.String(length=500), nullable=True))
    op.add_column("redemptions", sa.Column("return_idempotency_key", sa.String(length=120), nullable=True))
    op.add_column("redemptions", sa.Column("returned_by_user_id", sa.Uuid(), nullable=True))
    op.add_column("redemptions", sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True))

    op.execute(
        """
        UPDATE redemptions AS r
        SET
            item_name_snapshot = s.name,
            point_cost_snapshot = s.point_cost
        FROM shop_items AS s
        WHERE s.id = r.item_id
        """
    )

    op.alter_column("redemptions", "item_name_snapshot", nullable=False)
    op.alter_column("redemptions", "point_cost_snapshot", nullable=False)

    op.create_foreign_key(
        "fk_redemptions_returned_by_user_id_users",
        "redemptions",
        "users",
        ["returned_by_user_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_redemptions_return_idempotency_key"),
        "redemptions",
        ["return_idempotency_key"],
        unique=True,
    )
    op.create_index(
        op.f("ix_redemptions_returned_by_user_id"),
        "redemptions",
        ["returned_by_user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_redemptions_returned_by_user_id"), table_name="redemptions")
    op.drop_index(op.f("ix_redemptions_return_idempotency_key"), table_name="redemptions")
    op.drop_constraint("fk_redemptions_returned_by_user_id_users", "redemptions", type_="foreignkey")

    op.drop_column("redemptions", "returned_at")
    op.drop_column("redemptions", "returned_by_user_id")
    op.drop_column("redemptions", "return_idempotency_key")
    op.drop_column("redemptions", "return_notes")
    op.drop_column("redemptions", "point_cost_snapshot")
    op.drop_column("redemptions", "item_name_snapshot")
