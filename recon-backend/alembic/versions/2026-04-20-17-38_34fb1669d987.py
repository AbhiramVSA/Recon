"""merge treasure hunt reseed head

Revision ID: 34fb1669d987
Revises: c9d0e1f2a3b4, c1d2e3f4a5b6
Create Date: 2026-04-20 17:38:20.183942

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = '34fb1669d987'
down_revision: Union[str, Sequence[str], None] = ('c9d0e1f2a3b4', 'c1d2e3f4a5b6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
