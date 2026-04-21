"""add nokia lost signals treasure hunt problem

Revision ID: 9c8d7e6f5a4b
Revises: 7f2a9b6c4d1e
Create Date: 2026-04-20 23:10:00.000000

"""

from __future__ import annotations

import hashlib
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "9c8d7e6f5a4b"
down_revision: Union[str, Sequence[str], None] = "7f2a9b6c4d1e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _hash_flag(flag: str) -> str:
    return hashlib.sha256(flag.strip().lower().encode("utf-8")).hexdigest()


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            INSERT INTO treasure_hunt_problems (
                id,
                slug,
                title,
                teaser,
                body_markdown,
                hint_markdown,
                qr_token,
                flag_hash,
                sort_order,
                is_active
            ) VALUES (
                :id,
                :slug,
                :title,
                :teaser,
                :body_markdown,
                :hint_markdown,
                :qr_token,
                :flag_hash,
                :sort_order,
                :is_active
            )
            """
        ).bindparams(
            id=uuid.uuid4(),
            slug="nokia-3310-lost-signals",
            title="Nokia 3310: Lost Signals",
            teaser="Before messages were seen, they were heard. Follow the keypad rhythm.",
            body_markdown=(
                "Before messages were seen, they were heard. A relic from an older network hums quietly "
                "each tone deliberate, each pause meaningful.\n\n"
                "Somewhere in this sequence lies something once dialed, not typed. Those familiar with the rhythm of "
                "classic keypads might recognize the pattern.\n\n"
                "No contacts. No screen. Just echoes of a time when every press made itself known.\n\n"
                "[Download the recovered WAV]"
                "(https://drive.google.com/file/d/1bdrX_R5ULnNmH-Xuy5dt9_MCQBKZZ51e/view?usp=sharing)"
            ),
            hint_markdown="Think **classic multi-tap keypad input**. The `#` presses separate letters.",
            qr_token="th-08-nokia-3310-lost-signals",
            flag_hash=_hash_flag("NOKIA IS GOATED ICL"),
            sort_order=8,
            is_active=True,
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            DELETE FROM treasure_hunt_problems
            WHERE qr_token = :qr_token
            """
        ).bindparams(qr_token="th-08-nokia-3310-lost-signals")
    )
