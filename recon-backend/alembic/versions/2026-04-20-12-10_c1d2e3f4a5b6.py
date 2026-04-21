"""reseed treasure hunt from ctf problem bank

Revision ID: c1d2e3f4a5b6
Revises: a7b8c9d0e1f2
Create Date: 2026-04-20 12:10:00.000000

"""

from __future__ import annotations

import hashlib
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _hash_flag(flag: str) -> str:
    return hashlib.sha256(flag.strip().lower().encode("utf-8")).hexdigest()


PROBLEM_TABLE = sa.table(
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
)


NEW_PROBLEMS = [
    {
        "id": uuid.uuid4(),
        "slug": "dancing-men",
        "title": "Dancing Men",
        "teaser": "Decode the Sherlock-style glyphs hidden in the recovered strip.",
        "body_markdown": (
            "A field notebook included the cipher strip below. Decode it to recover the flag.\n\n"
            "![Dancing Men cipher](/hunt-assets/dancing-men.png)"
        ),
        "hint_markdown": "This uses the classic **Dancing Men** substitution cipher from Sherlock Holmes.",
        "qr_token": "th-01-dancing-men",
        "flag_hash": _hash_flag("ELEMENTARY MY DEAR WATSON"),
        "sort_order": 1,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "unown-pokemon-alphabet",
        "title": "Unown Pokemon Alphabet",
        "teaser": "The symbols are not random. Read them with the right alphabet.",
        "body_markdown": (
            "An intercepted image uses a familiar game-world glyph set. Decode it to recover the flag.\n\n"
            "![Unown alphabet challenge](/hunt-assets/pokemon-unown.png)"
        ),
        "hint_markdown": "Treat the symbols as the **Pokemon Unown alphabet**.",
        "qr_token": "th-02-unown-pokemon-alphabet",
        "flag_hash": _hash_flag("THE DARK KNIGHT ALWAYS RISES"),
        "sort_order": 2,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "semaphore-trousers-cipher",
        "title": "Semaphore Trousers Cipher",
        "teaser": "The pose matters more than the character. Read the signaling positions.",
        "body_markdown": (
            "The image below hides a message using semaphore-style positions. Decode it to recover the flag.\n\n"
            "![Semaphore Trousers cipher](/hunt-assets/semaphore-trousers.png)"
        ),
        "hint_markdown": "Use a **semaphore alphabet chart**. Focus on the arm and leg positions.",
        "qr_token": "th-03-semaphore-trousers-cipher",
        "flag_hash": _hash_flag("ONE DOES NOT SIMPLY WALK"),
        "sort_order": 3,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "lunar-alphabet",
        "title": "Lunar Alphabet",
        "teaser": "The glyphs echo moon phases and arcs. Translate them into letters.",
        "body_markdown": (
            "A lunar-themed symbol sheet was recovered from the drop site. Decode it to recover the flag.\n\n"
            "![Lunar alphabet challenge](/hunt-assets/luna.png)"
        ),
        "hint_markdown": "This puzzle uses a **lunar alphabet** rather than a standard substitution grid.",
        "qr_token": "th-04-lunar-alphabet",
        "flag_hash": _hash_flag("KEEP YOUR FRIENDS CLOSE"),
        "sort_order": 4,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "braile-decode",
        "title": "Braile Decode",
        "teaser": "The transmission has no text layer. The dots are the message.",
        "body_markdown": (
            "We intercepted a high-frequency burst from an unknown relay.\n\n"
            "Preliminary analysis shows no text layer or hidden strings in the document body, only a series of "
            "high-contrast visual markers. Our intelligence suggests the data is encoded in Grade 1 Braille, "
            "used as a visual cipher for automated optical systems.\n\n"
            "Open the recovered file and decode the flag:\n\n"
            "[Open transmission log PDF](/hunt-assets/transmission-log-0418.pdf)"
        ),
        "hint_markdown": "Read the document as **Grade 1 Braille**.",
        "qr_token": "th-05-braile-decode",
        "flag_hash": _hash_flag("recon{br4il3_d3c0de_$ucc$$}"),
        "sort_order": 5,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "qr-code",
        "title": "QR Code",
        "teaser": "The obvious scan result is not the whole story.",
        "body_markdown": (
            "Our threat intelligence team intercepted a suspicious QR code posted on an internal NovaTech "
            "noticeboard during last night's shift.\n\n"
            "At first glance it links to a harmless video, but analysts believe it was planted deliberately and "
            "that a second concealed payload is embedded somewhere inside it.\n\n"
            "Inspect the challenge asset and recover the hidden flag:\n\n"
            "![Challenge QR](/hunt-assets/challenge-qr.png)"
        ),
        "hint_markdown": "The visible scan result is a decoy. Inspect the artifact more closely for hidden data.",
        "qr_token": "th-06-qr-code",
        "flag_hash": _hash_flag("recon{h1dd3n_1n_bl1n9_s1ght}"),
        "sort_order": 6,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "satellite-intercept",
        "title": "Satellite Intercept",
        "teaser": "The image cache survived. The metadata tells the rest of the story.",
        "body_markdown": (
            "A rogue field agent was tracked to a secure location, but they managed to wipe their device before "
            "being apprehended.\n\n"
            "However, our digital forensics team recovered a single image from the cache: a surveillance shot of "
            "a satellite intercept. Inspect the metadata and see whether the user left behind a link.\n\n"
            "![Recovered field image](/hunt-assets/field-evidence-099.jpg)"
        ),
        "hint_markdown": "Do not stop at the pixels. Check the image **metadata / EXIF**.",
        "qr_token": "th-07-satellite-intercept",
        "flag_hash": _hash_flag("recon{ex1f_f0und_hostel_tr4ce}"),
        "sort_order": 7,
        "is_active": True,
    },
]


OLD_PROBLEMS = [
    {
        "id": uuid.uuid4(),
        "slug": "shifted-ssid",
        "title": "Shifted SSID",
        "teaser": "The Wi-Fi sticky note looks shifted. Recover the real flag.",
        "body_markdown": (
            "A volunteer wrote the guest Wi-Fi clue using a Caesar shift of `+3`.\n\n"
            "Decode this text to get the flag:\n\n"
            "```text\nUHFRQ{FDHVDU_RYHU_FRIIHH}\n```"
        ),
        "hint_markdown": "Shift every alphabet character **back by 3**. Symbols stay the same.",
        "qr_token": "th-01-shifted-ssid",
        "flag_hash": _hash_flag("RECON{CAESAR_OVER_COFFEE}"),
        "sort_order": 1,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "badge-b64",
        "title": "Badge B64",
        "teaser": "A badge printer leak exposed a base64 blob.",
        "body_markdown": (
            "The badge printer log stored this blob. Decode it to recover the flag:\n\n"
            "```text\nUkVDT057QjY0X0JBREdFX0JJTkdPfQ==\n```"
        ),
        "hint_markdown": "This is standard **Base64**.",
        "qr_token": "th-02-badge-b64",
        "flag_hash": _hash_flag("RECON{B64_BADGE_BINGO}"),
        "sort_order": 2,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "redirect-maze",
        "title": "Redirect Maze",
        "teaser": "A phishing redirect parameter was percent-encoded.",
        "body_markdown": (
            "A suspicious redirect parameter was captured exactly as shown below.\n"
            "Decode the URL-encoded text to get the flag:\n\n"
            "```text\n%52%45%43%4F%4E%7B%55%52%4C%53%5F%43%41%4E%5F%4C%49%45%7D\n```"
        ),
        "hint_markdown": "Each `%XX` is one byte in hexadecimal.",
        "qr_token": "th-03-redirect-maze",
        "flag_hash": _hash_flag("RECON{URLS_CAN_LIE}"),
        "sort_order": 3,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "packet-hex",
        "title": "Packet Hex",
        "teaser": "Only the raw packet bytes survived.",
        "body_markdown": (
            "The notes from a packet capture only kept the hex bytes below.\n"
            "Convert the hex into text to recover the flag:\n\n"
            "```text\n5245434f4e7b4845585f44554d50535f54454c4c5f53544f524945537d\n```"
        ),
        "hint_markdown": "Two hex characters form one ASCII byte.",
        "qr_token": "th-04-packet-hex",
        "flag_hash": _hash_flag("RECON{HEX_DUMPS_TELL_STORIES}"),
        "sort_order": 4,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "binary-buzz",
        "title": "Binary Buzz",
        "teaser": "An alert came in as straight binary.",
        "body_markdown": (
            "Convert this binary ASCII into text to recover the flag:\n\n"
            "```text\n01010010 01000101 01000011 01001111 01001110 01111011 01000010 01001001 01010100 01010011 01011111 01000010 01000101 01000001 01010100 01011111 01000111 01010101 01000101 01010011 01010011 01000101 01010011 01111101\n```"
        ),
        "hint_markdown": "Split into 8-bit groups and convert each to a character.",
        "qr_token": "th-05-binary-buzz",
        "flag_hash": _hash_flag("RECON{BITS_BEAT_GUESSES}"),
        "sort_order": 5,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "rot13-breach",
        "title": "ROT13 Breach",
        "teaser": "Someone called ROT13 encryption. It was not.",
        "body_markdown": (
            "An incident memo says the answer was \"protected\" with ROT13.\n"
            "Undo it to get the flag:\n\n"
            "```text\nERPBA{EBG13_VF_ABG_FRPHEVGL}\n```"
        ),
        "hint_markdown": "Apply **ROT13** once more.",
        "qr_token": "th-06-rot13-breach",
        "flag_hash": _hash_flag("RECON{ROT13_IS_NOT_SECURITY}"),
        "sort_order": 6,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "leet-locker",
        "title": "Leet Locker",
        "teaser": "A fake ransomware actor used leetspeak as camouflage.",
        "body_markdown": (
            "Replace the leetspeak characters with letters to recover the flag:\n\n"
            "```text\nR3C0N{L3375P34K_15_N07_3NCRYP710N}\n```"
        ),
        "hint_markdown": "`3=E`, `0=O`, `4=A`, `1=I`, `5=S`, `7=T`.",
        "qr_token": "th-07-leet-locker",
        "flag_hash": _hash_flag("RECON{LEETSPEAK_IS_NOT_ENCRYPTION}"),
        "sort_order": 7,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "cookie-crumbs",
        "title": "Cookie Crumbs",
        "teaser": "The secret was split across three cookie fragments.",
        "body_markdown": (
            "Join these fragments in order to reconstruct the flag:\n\n"
            "```text\ncookie_part_1=RECON{COOK\ncookie_part_2=IES_SPLIT_\ncookie_part_3=SECRETS}\n```"
        ),
        "hint_markdown": "Ignore the cookie names and concatenate the values from 1 to 3.",
        "qr_token": "th-08-cookie-crumbs",
        "flag_hash": _hash_flag("RECON{COOKIES_SPLIT_SECRETS}"),
        "sort_order": 8,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "header-hunt",
        "title": "Header Hunt",
        "teaser": "The flag is hiding in an HTTP response header.",
        "body_markdown": (
            "Read the response headers carefully and submit the flag value:\n\n"
            "```http\nHTTP/1.1 200 OK\nServer: recon-edge\nX-Trace: 8842af1e\nX-Flag: RECON{READ_THE_HEADERS}\nCache-Control: no-store\n```"
        ),
        "hint_markdown": "You do not need to decode anything here. Read closely.",
        "qr_token": "th-09-header-hunt",
        "flag_hash": _hash_flag("RECON{READ_THE_HEADERS}"),
        "sort_order": 9,
        "is_active": True,
    },
    {
        "id": uuid.uuid4(),
        "slug": "reverse-rumor",
        "title": "Reverse Rumor",
        "teaser": "A phishing rumor pasted the answer backwards.",
        "body_markdown": (
            "Reverse the text below to recover the flag:\n\n"
            "```text\n}SNIW_SCISNEROF_ELIBOM{NOCER\n```"
        ),
        "hint_markdown": "Read it from right to left.",
        "qr_token": "th-10-reverse-rumor",
        "flag_hash": _hash_flag("RECON{MOBILE_FORENSICS_WINS}"),
        "sort_order": 10,
        "is_active": True,
    },
]


def _reset_treasure_hunt_state() -> None:
    op.execute(
        """
        DELETE FROM team_competition_settlement_allocations
        WHERE settlement_id IN (
            SELECT id FROM team_competition_settlements WHERE event_key = 'treasure_hunt'
        )
        """
    )
    op.execute("DELETE FROM point_ledger WHERE reason = 'competition.settlement.treasure_hunt'")
    op.execute("DELETE FROM team_competition_settlements WHERE event_key = 'treasure_hunt'")
    op.execute("DELETE FROM team_competition_ledger WHERE event_key = 'treasure_hunt'")
    op.execute("DELETE FROM team_competition_round_scores WHERE event_key = 'treasure_hunt'")
    op.execute("DELETE FROM treasure_hunt_solves")
    op.execute("DELETE FROM treasure_hunt_team_progress")
    op.execute("DELETE FROM treasure_hunt_problems")


def _insert_problem_rows(rows: list[dict[str, object]]) -> None:
    op.bulk_insert(PROBLEM_TABLE, rows)


def upgrade() -> None:
    _reset_treasure_hunt_state()
    _insert_problem_rows(NEW_PROBLEMS)


def downgrade() -> None:
    _reset_treasure_hunt_state()
    _insert_problem_rows(OLD_PROBLEMS)
