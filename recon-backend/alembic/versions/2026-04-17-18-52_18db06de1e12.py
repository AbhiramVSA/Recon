"""add teams and treasure hunt

Revision ID: 18db06de1e12
Revises: f1a2b3c4d5e6
Create Date: 2026-04-17 18:52:31.050843

"""

from datetime import datetime, timezone
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


revision: str = "18db06de1e12"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TREASURE_HUNT_PROBLEMS = [
    {
        "slug": "shifted-ssid",
        "title": "Shifted SSID",
        "teaser": "The Wi-Fi sticky note looks shifted. Recover the real flag.",
        "body_markdown": "A volunteer wrote the guest Wi-Fi clue using a Caesar shift of `+3`.\n\nDecode this text to get the flag:\n\n```text\nUHFRQ{FDHVDU_RYHU_FRIIHH}\n```",
        "hint_markdown": "Shift every alphabet character **back by 3**. Symbols stay the same.",
        "qr_token": "th-01-shifted-ssid",
        "flag_hash": "50681b7f6cfeba50602a14d75e3a49a65345280dce3723cadd56aaa22723c722",
        "sort_order": 1,
    },
    {
        "slug": "badge-b64",
        "title": "Badge B64",
        "teaser": "A badge printer leak exposed a base64 blob.",
        "body_markdown": "The badge printer log stored this blob. Decode it to recover the flag:\n\n```text\nUkVDT057QjY0X0JBREdFX0JJTkdPfQ==\n```",
        "hint_markdown": "This is standard **Base64**.",
        "qr_token": "th-02-badge-b64",
        "flag_hash": "9dc0d90d7dd9a1b016fa86baef92c1cf63f1ed7783ef794ffbe5a54174f5e2c3",
        "sort_order": 2,
    },
    {
        "slug": "redirect-maze",
        "title": "Redirect Maze",
        "teaser": "A phishing redirect parameter was percent-encoded.",
        "body_markdown": "A suspicious redirect parameter was captured exactly as shown below.\nDecode the URL-encoded text to get the flag:\n\n```text\n%52%45%43%4F%4E%7B%55%52%4C%53%5F%43%41%4E%5F%4C%49%45%7D\n```",
        "hint_markdown": "Each `%XX` is one byte in hexadecimal.",
        "qr_token": "th-03-redirect-maze",
        "flag_hash": "e3d02764b1f5d276b5451a5cabaaa9ab39a585b170db039e628fc4f1438dd538",
        "sort_order": 3,
    },
    {
        "slug": "packet-hex",
        "title": "Packet Hex",
        "teaser": "Only the raw packet bytes survived.",
        "body_markdown": "The notes from a packet capture only kept the hex bytes below.\nConvert the hex into text to recover the flag:\n\n```text\n5245434f4e7b4845585f44554d50535f54454c4c5f53544f524945537d\n```",
        "hint_markdown": "Two hex characters form one ASCII byte.",
        "qr_token": "th-04-packet-hex",
        "flag_hash": "0d8c982d414a6d1919a4be56ffa6bd4ebd7f122a78858e8f826e4813f72c648d",
        "sort_order": 4,
    },
    {
        "slug": "binary-buzz",
        "title": "Binary Buzz",
        "teaser": "An alert came in as straight binary.",
        "body_markdown": "Convert this binary ASCII into text to recover the flag:\n\n```text\n01010010 01000101 01000011 01001111 01001110 01111011 01000010 01001001 01010100 01010011 01011111 01000010 01000101 01000001 01010100 01011111 01000111 01010101 01000101 01010011 01010011 01000101 01010011 01111101\n```",
        "hint_markdown": "Split into 8-bit groups and convert each to a character.",
        "qr_token": "th-05-binary-buzz",
        "flag_hash": "bbdc4d3e82e6c64c5cec7ebca44353688c0f2359eda17d06e210257666ed8c36",
        "sort_order": 5,
    },
    {
        "slug": "rot13-breach",
        "title": "ROT13 Breach",
        "teaser": "Someone called ROT13 encryption. It was not.",
        "body_markdown": "An incident memo says the answer was \"protected\" with ROT13.\nUndo it to get the flag:\n\n```text\nERPBA{EBG13_VF_ABG_FRPHEVGL}\n```",
        "hint_markdown": "Apply **ROT13** once more.",
        "qr_token": "th-06-rot13-breach",
        "flag_hash": "a3fa2ab3cda5da73002bcfff7a18fb0fa99bff536636c9315f16ba228f105e78",
        "sort_order": 6,
    },
    {
        "slug": "leet-locker",
        "title": "Leet Locker",
        "teaser": "A fake ransomware actor used leetspeak as camouflage.",
        "body_markdown": "Replace the leetspeak characters with letters to recover the flag:\n\n```text\nR3C0N{L3375P34K_15_N07_3NCRYP710N}\n```",
        "hint_markdown": "`3=E`, `0=O`, `4=A`, `1=I`, `5=S`, `7=T`.",
        "qr_token": "th-07-leet-locker",
        "flag_hash": "64dc75574267d06bad4833ccd1fc0d6d5ad9e065b512ef38dde733c2d45978ea",
        "sort_order": 7,
    },
    {
        "slug": "cookie-crumbs",
        "title": "Cookie Crumbs",
        "teaser": "The secret was split across three cookie fragments.",
        "body_markdown": "Join these fragments in order to reconstruct the flag:\n\n```text\ncookie_part_1=RECON{COOK\ncookie_part_2=IES_SPLIT_\ncookie_part_3=SECRETS}\n```",
        "hint_markdown": "Ignore the cookie names and concatenate the values from 1 to 3.",
        "qr_token": "th-08-cookie-crumbs",
        "flag_hash": "9aff2a0fb09a62e5e10b18d53ef54785259b604d6a8b01d7923e0161511a0392",
        "sort_order": 8,
    },
    {
        "slug": "header-hunt",
        "title": "Header Hunt",
        "teaser": "The flag is hiding in an HTTP response header.",
        "body_markdown": "Read the response headers carefully and submit the flag value:\n\n```http\nHTTP/1.1 200 OK\nServer: recon-edge\nX-Trace: 8842af1e\nX-Flag: RECON{READ_THE_HEADERS}\nCache-Control: no-store\n```",
        "hint_markdown": "You do not need to decode anything here. Read closely.",
        "qr_token": "th-09-header-hunt",
        "flag_hash": "db75a73b39d4355187139d2493a85152cf76400d5ba66c15a566112bff9d949b",
        "sort_order": 9,
    },
    {
        "slug": "reverse-rumor",
        "title": "Reverse Rumor",
        "teaser": "A phishing rumor pasted the answer backwards.",
        "body_markdown": "Reverse the text below to recover the flag:\n\n```text\n}SNIW_SCISNEROF_ELIBOM{NOCER\n```",
        "hint_markdown": "Read it from right to left.",
        "qr_token": "th-10-reverse-rumor",
        "flag_hash": "b371ae1a88979a0d7e004e12a0fabe540b3294ea71962e6599725a804b44bd67",
        "sort_order": 10,
    },
]


def upgrade() -> None:
    op.create_table(
        "treasure_hunt_problems",
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("teaser", sa.String(length=200), nullable=False),
        sa.Column("body_markdown", sa.String(length=4000), nullable=False),
        sa.Column("hint_markdown", sa.String(length=1000), nullable=True),
        sa.Column("qr_token", sa.String(length=120), nullable=False),
        sa.Column("flag_hash", sa.String(length=64), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_treasure_hunt_problems_id"), "treasure_hunt_problems", ["id"], unique=False)
    op.create_index(op.f("ix_treasure_hunt_problems_is_active"), "treasure_hunt_problems", ["is_active"], unique=False)
    op.create_index(op.f("ix_treasure_hunt_problems_qr_token"), "treasure_hunt_problems", ["qr_token"], unique=True)
    op.create_index(op.f("ix_treasure_hunt_problems_slug"), "treasure_hunt_problems", ["slug"], unique=True)
    op.create_index(op.f("ix_treasure_hunt_problems_sort_order"), "treasure_hunt_problems", ["sort_order"], unique=False)

    op.create_table(
        "teams",
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("invite_code", sa.String(length=16), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by_participant_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["created_by_participant_id"], ["participants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_teams_created_by_participant_id"), "teams", ["created_by_participant_id"], unique=False)
    op.create_index(op.f("ix_teams_id"), "teams", ["id"], unique=False)
    op.create_index(op.f("ix_teams_invite_code"), "teams", ["invite_code"], unique=True)
    op.create_index(op.f("ix_teams_name"), "teams", ["name"], unique=True)

    op.create_table(
        "team_memberships",
        sa.Column("team_id", sa.Uuid(), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["participants.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("team_id", "participant_id", name="uq_team_memberships_team_participant"),
    )
    op.create_index(op.f("ix_team_memberships_id"), "team_memberships", ["id"], unique=False)
    op.create_index(op.f("ix_team_memberships_participant_id"), "team_memberships", ["participant_id"], unique=True)
    op.create_index(op.f("ix_team_memberships_team_id"), "team_memberships", ["team_id"], unique=False)

    op.create_table(
        "treasure_hunt_solves",
        sa.Column("team_id", sa.Uuid(), nullable=False),
        sa.Column("problem_id", sa.Uuid(), nullable=False),
        sa.Column("solved_by_participant_id", sa.Uuid(), nullable=False),
        sa.Column("idempotency_key", sa.String(length=120), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("solved_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["problem_id"], ["treasure_hunt_problems.id"]),
        sa.ForeignKeyConstraint(["solved_by_participant_id"], ["participants.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("team_id", "problem_id", name="uq_treasure_hunt_solves_team_problem"),
    )
    op.create_index(op.f("ix_treasure_hunt_solves_id"), "treasure_hunt_solves", ["id"], unique=False)
    op.create_index(op.f("ix_treasure_hunt_solves_idempotency_key"), "treasure_hunt_solves", ["idempotency_key"], unique=True)
    op.create_index(op.f("ix_treasure_hunt_solves_problem_id"), "treasure_hunt_solves", ["problem_id"], unique=False)
    op.create_index(op.f("ix_treasure_hunt_solves_solved_by_participant_id"), "treasure_hunt_solves", ["solved_by_participant_id"], unique=False)
    op.create_index(op.f("ix_treasure_hunt_solves_team_id"), "treasure_hunt_solves", ["team_id"], unique=False)

    op.create_table(
        "treasure_hunt_team_progress",
        sa.Column("team_id", sa.Uuid(), nullable=False),
        sa.Column("solved_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_solved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finish_rank", sa.Integer(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_treasure_hunt_team_progress_completed_at"), "treasure_hunt_team_progress", ["completed_at"], unique=False)
    op.create_index(op.f("ix_treasure_hunt_team_progress_finish_rank"), "treasure_hunt_team_progress", ["finish_rank"], unique=True)
    op.create_index(op.f("ix_treasure_hunt_team_progress_id"), "treasure_hunt_team_progress", ["id"], unique=False)
    op.create_index(op.f("ix_treasure_hunt_team_progress_team_id"), "treasure_hunt_team_progress", ["team_id"], unique=True)

    problems_table = sa.table(
        "treasure_hunt_problems",
        sa.column("id", sa.Uuid()),
        sa.column("slug", sa.String(length=80)),
        sa.column("title", sa.String(length=120)),
        sa.column("teaser", sa.String(length=200)),
        sa.column("body_markdown", sa.String(length=4000)),
        sa.column("hint_markdown", sa.String(length=1000)),
        sa.column("qr_token", sa.String(length=120)),
        sa.column("flag_hash", sa.String(length=64)),
        sa.column("sort_order", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    now = datetime.now(timezone.utc)
    op.bulk_insert(
        problems_table,
        [
            {
                "id": uuid.uuid4(),
                "slug": row["slug"],
                "title": row["title"],
                "teaser": row["teaser"],
                "body_markdown": row["body_markdown"],
                "hint_markdown": row["hint_markdown"],
                "qr_token": row["qr_token"],
                "flag_hash": row["flag_hash"],
                "sort_order": row["sort_order"],
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            for row in TREASURE_HUNT_PROBLEMS
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_treasure_hunt_team_progress_team_id"), table_name="treasure_hunt_team_progress")
    op.drop_index(op.f("ix_treasure_hunt_team_progress_id"), table_name="treasure_hunt_team_progress")
    op.drop_index(op.f("ix_treasure_hunt_team_progress_finish_rank"), table_name="treasure_hunt_team_progress")
    op.drop_index(op.f("ix_treasure_hunt_team_progress_completed_at"), table_name="treasure_hunt_team_progress")
    op.drop_table("treasure_hunt_team_progress")

    op.drop_index(op.f("ix_treasure_hunt_solves_team_id"), table_name="treasure_hunt_solves")
    op.drop_index(op.f("ix_treasure_hunt_solves_solved_by_participant_id"), table_name="treasure_hunt_solves")
    op.drop_index(op.f("ix_treasure_hunt_solves_problem_id"), table_name="treasure_hunt_solves")
    op.drop_index(op.f("ix_treasure_hunt_solves_idempotency_key"), table_name="treasure_hunt_solves")
    op.drop_index(op.f("ix_treasure_hunt_solves_id"), table_name="treasure_hunt_solves")
    op.drop_table("treasure_hunt_solves")

    op.drop_index(op.f("ix_team_memberships_team_id"), table_name="team_memberships")
    op.drop_index(op.f("ix_team_memberships_participant_id"), table_name="team_memberships")
    op.drop_index(op.f("ix_team_memberships_id"), table_name="team_memberships")
    op.drop_table("team_memberships")

    op.drop_index(op.f("ix_teams_name"), table_name="teams")
    op.drop_index(op.f("ix_teams_invite_code"), table_name="teams")
    op.drop_index(op.f("ix_teams_id"), table_name="teams")
    op.drop_index(op.f("ix_teams_created_by_participant_id"), table_name="teams")
    op.drop_table("teams")

    op.drop_index(op.f("ix_treasure_hunt_problems_sort_order"), table_name="treasure_hunt_problems")
    op.drop_index(op.f("ix_treasure_hunt_problems_slug"), table_name="treasure_hunt_problems")
    op.drop_index(op.f("ix_treasure_hunt_problems_qr_token"), table_name="treasure_hunt_problems")
    op.drop_index(op.f("ix_treasure_hunt_problems_is_active"), table_name="treasure_hunt_problems")
    op.drop_index(op.f("ix_treasure_hunt_problems_id"), table_name="treasure_hunt_problems")
    op.drop_table("treasure_hunt_problems")
