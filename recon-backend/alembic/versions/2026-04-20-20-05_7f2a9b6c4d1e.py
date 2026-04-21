"""normalize lockhunt flags to plain-text format

Revision ID: 7f2a9b6c4d1e
Revises: 34fb1669d987
Create Date: 2026-04-20 20:05:00.000000

"""

from __future__ import annotations

import hashlib
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "7f2a9b6c4d1e"
down_revision: Union[str, Sequence[str], None] = "34fb1669d987"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _hash_flag(flag: str) -> str:
    return hashlib.sha256(flag.strip().lower().encode("utf-8")).hexdigest()


def _set_flag_hash(*, qr_token: str, flag: str) -> None:
    op.execute(
        sa.text(
            """
            UPDATE treasure_hunt_problems
            SET flag_hash = :flag_hash
            WHERE qr_token = :qr_token
            """
        ).bindparams(flag_hash=_hash_flag(flag), qr_token=qr_token)
    )


def upgrade() -> None:
    _set_flag_hash(qr_token="th-05-braile-decode", flag="BRAILLE DECODE SUCCESS")
    _set_flag_hash(qr_token="th-06-qr-code", flag="HIDDEN IN PLAIN SIGHT")
    _set_flag_hash(qr_token="th-07-satellite-intercept", flag="EXIF FOUND HOSTEL TRACE")


def downgrade() -> None:
    _set_flag_hash(qr_token="th-05-braile-decode", flag="recon{br4il3_d3c0de_$ucc$$}")
    _set_flag_hash(qr_token="th-06-qr-code", flag="recon{h1dd3n_1n_bl1n9_s1ght}")
    _set_flag_hash(qr_token="th-07-satellite-intercept", flag="recon{ex1f_f0und_hostel_tr4ce}")

