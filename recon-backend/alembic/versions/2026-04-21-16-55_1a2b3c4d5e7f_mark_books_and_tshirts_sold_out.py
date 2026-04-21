"""mark books and t-shirts sold out

Revision ID: 1a2b3c4d5e7f
Revises: 9c8d7e6f5a4b
Create Date: 2026-04-21 16:55:00.000000

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "1a2b3c4d5e7f"
down_revision: Union[str, Sequence[str], None] = "9c8d7e6f5a4b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _set_stock(name: str, stock: int) -> None:
    op.execute(
        sa.text(
            """
            UPDATE shop_items
            SET stock = :stock
            WHERE name = :name
            """
        ).bindparams(name=name, stock=stock)
    )


def upgrade() -> None:
    _set_stock("RECON 2026 T-Shirt - Operator Edition", 67)
    _set_stock("OSEN T-Shirt", 0)
    _set_stock("Cybersecurity Book", 0)


def downgrade() -> None:
    _set_stock("RECON 2026 T-Shirt - Operator Edition", 48)
    _set_stock("OSEN T-Shirt", 32)
    _set_stock("Cybersecurity Book", 10)
