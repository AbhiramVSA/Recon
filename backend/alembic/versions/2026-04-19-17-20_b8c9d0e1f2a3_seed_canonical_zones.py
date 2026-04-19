"""seed canonical zones

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-04-19 17:20:00
"""

from __future__ import annotations

import json

from alembic import op


revision = "b8c9d0e1f2a3"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def _quote(value: str) -> str:
    return value.replace("'", "''")


ZONES: list[dict[str, object]] = [
    {
        "name": "Capture The Flag",
        "short_name": "CTF",
        "category": "COMPETITIVE",
        "zone_type": "flagship",
        "status": "green",
        "location": "Central Block - Lab 101",
        "points": 200,
        "registration_required": True,
        "registration_points": 0,
        "check_in_points": 200,
        "color": "#d4a843",
        "tags": ["OVERNIGHT", "12 HRS", "JEOPARDY"],
    },
    {
        "name": "King of the Hill",
        "short_name": "KOTH",
        "category": "COMPETITIVE",
        "zone_type": "flagship",
        "status": "green",
        "location": "Central Block - Lab 102",
        "points": 200,
        "registration_required": True,
        "registration_points": 0,
        "check_in_points": 200,
        "color": "#ef4444",
        "tags": ["OVERNIGHT", "8 HRS", "ATTACK-DEFENCE"],
    },
    {
        "name": "NFC Lock Hunt",
        "short_name": "NFC",
        "category": "HARDWARE",
        "zone_type": "side",
        "status": "green",
        "location": "Central Block - Room 322",
        "points": 50,
        "registration_required": True,
        "registration_points": 0,
        "check_in_points": 50,
        "color": "#22c55e",
        "tags": ["HARDWARE", "PHYSICAL"],
    },
    {
        "name": "Hardware Badge and IoT Village",
        "short_name": "HARDWARE",
        "category": "HARDWARE",
        "zone_type": "side",
        "status": "green",
        "location": "Central Block - Lab 203",
        "points": 50,
        "registration_required": True,
        "registration_points": 0,
        "check_in_points": 50,
        "color": "#f97316",
        "tags": ["HARDWARE", "HANDS-ON"],
    },
    {
        "name": "App Sec Zone",
        "short_name": "APPSEC",
        "category": "WEB",
        "zone_type": "side",
        "status": "green",
        "location": "Central Block - Room 315",
        "points": 50,
        "registration_required": True,
        "registration_points": 0,
        "check_in_points": 50,
        "color": "#3b82f6",
        "tags": ["WEB", "MOBILE"],
    },
    {
        "name": "Media Forensics",
        "short_name": "FORENSICS",
        "category": "FORENSICS",
        "zone_type": "side",
        "status": "green",
        "location": "Central Block - Room 325",
        "points": 50,
        "registration_required": True,
        "registration_points": 0,
        "check_in_points": 50,
        "color": "#a855f7",
        "tags": ["FORENSICS", "AI"],
    },
    {
        "name": "Hacking Arena",
        "short_name": "ARENA",
        "category": "COMPETITIVE",
        "zone_type": "side",
        "status": "green",
        "location": "Central Block - Room 314",
        "points": 75,
        "registration_required": True,
        "registration_points": 0,
        "check_in_points": 75,
        "color": "#eab308",
        "tags": ["SPEED", "COMPETITIVE"],
    },
    {
        "name": "Cyber Expo",
        "short_name": "EXPO",
        "category": "EXPO",
        "zone_type": "side",
        "status": "green",
        "location": "Central Block - Room 324",
        "points": 25,
        "registration_required": True,
        "registration_points": 0,
        "check_in_points": 25,
        "color": "#06b6d4",
        "tags": ["EXPO", "NETWORKING"],
    },
    {
        "name": "Escape Room",
        "short_name": "ESCAPE",
        "category": "PUZZLE",
        "zone_type": "side",
        "status": "green",
        "location": "Central Block - Room 301",
        "points": 75,
        "registration_required": True,
        "registration_points": 0,
        "check_in_points": 75,
        "color": "#10b981",
        "tags": ["PUZZLE", "TEAM"],
    },
    {
        "name": "Gaming Arena",
        "short_name": "GAMING",
        "category": "GAMING",
        "zone_type": "side",
        "status": "green",
        "location": "Central Block - Room 221",
        "points": 0,
        "registration_required": False,
        "registration_points": 0,
        "check_in_points": 0,
        "color": "#8b5cf6",
        "tags": ["GAMING", "CASUAL"],
    },
    {
        "name": "Art Zone",
        "short_name": "ART",
        "category": "CREATIVE",
        "zone_type": "side",
        "status": "green",
        "location": "Central Block - Room 316",
        "points": 0,
        "registration_required": False,
        "registration_points": 0,
        "check_in_points": 0,
        "color": "#ec4899",
        "tags": ["CREATIVE", "ART"],
    },
]


def upgrade() -> None:
    for zone in ZONES:
        tags_json = _quote(json.dumps(zone["tags"]))
        op.execute(
            f"""
            INSERT INTO zones (
                id,
                name,
                short_name,
                category,
                zone_type,
                status,
                location,
                points,
                registration_required,
                registration_points,
                check_in_points,
                color,
                tags,
                is_active
            )
            VALUES (
                gen_random_uuid(),
                '{_quote(zone["name"])}',
                '{_quote(zone["short_name"])}',
                '{_quote(zone["category"])}',
                '{_quote(zone["zone_type"])}',
                '{_quote(zone["status"])}',
                '{_quote(zone["location"])}',
                {int(zone["points"])},
                {str(bool(zone["registration_required"])).upper()},
                {int(zone["registration_points"])},
                {int(zone["check_in_points"])},
                '{_quote(zone["color"])}',
                '{tags_json}'::json,
                TRUE
            )
            ON CONFLICT (short_name) DO UPDATE
            SET
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                zone_type = EXCLUDED.zone_type,
                status = EXCLUDED.status,
                location = EXCLUDED.location,
                points = EXCLUDED.points,
                registration_required = EXCLUDED.registration_required,
                registration_points = EXCLUDED.registration_points,
                check_in_points = EXCLUDED.check_in_points,
                color = EXCLUDED.color,
                tags = EXCLUDED.tags,
                is_active = TRUE
            """
        )


def downgrade() -> None:
    short_names = ", ".join(f"'{_quote(str(zone['short_name']))}'" for zone in ZONES)
    op.execute(f"DELETE FROM zones WHERE short_name IN ({short_names})")
