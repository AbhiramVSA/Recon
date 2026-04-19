"""move zone rewards to admin scan check-in

Revision ID: a7b8c9d0e1f2
Revises: f0a1b2c3d4e6
Create Date: 2026-04-20 00:35:00.000000

"""

from typing import Sequence, Union

from alembic import op


revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "f0a1b2c3d4e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE zones
        SET registration_required = CASE
                WHEN lower(short_name) IN ('art', 'gaming') THEN FALSE
                ELSE TRUE
            END,
            check_in_points = CASE
                WHEN lower(short_name) IN ('art', 'gaming') THEN 0
                ELSE GREATEST(COALESCE(check_in_points, 0), COALESCE(registration_points, 0), COALESCE(points, 0))
            END,
            registration_points = 0,
            points = CASE
                WHEN lower(short_name) IN ('art', 'gaming') THEN 0
                ELSE GREATEST(COALESCE(check_in_points, 0), COALESCE(registration_points, 0), COALESCE(points, 0))
            END
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE zones
        SET registration_required = TRUE,
            registration_points = GREATEST(COALESCE(registration_points, 0), COALESCE(points, 0)),
            check_in_points = 0,
            points = GREATEST(COALESCE(registration_points, 0), COALESCE(points, 0))
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
