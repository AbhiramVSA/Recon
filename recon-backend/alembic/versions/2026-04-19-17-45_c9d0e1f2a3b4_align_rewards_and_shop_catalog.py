"""align rewards and shop catalog

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-04-19 17:45:00
"""

from __future__ import annotations

from alembic import op


revision = "c9d0e1f2a3b4"
down_revision = "b8c9d0e1f2a3"
branch_labels = None
depends_on = None


def _quote(value: str) -> str:
    return value.replace("'", "''")


ZONE_REWARDS: dict[str, int] = {
    "CTF": 100,
    "KOTH": 100,
    "NFC": 100,
    "HARDWARE": 100,
    "APPSEC": 100,
    "FORENSICS": 100,
    "ARENA": 100,
    "EXPO": 50,
    "ESCAPE": 100,
    "GAMING": 0,
    "ART": 0,
}


SHOP_ITEMS: list[dict[str, object]] = [
    {
        "name": "RECON 2026 T-Shirt - Operator Edition",
        "description": "Dark ops tactical tee with RECON 2026 wordmark on front and event callsign print on back.",
        "point_cost": 2000,
        "stock": 48,
        "photo_key": "/merch/merch01.webp",
    },
    {
        "name": "OSEN T-Shirt",
        "description": "Official OSEN collaboration tee for operators who want the community edition drop.",
        "point_cost": 2000,
        "stock": 32,
        "photo_key": "/merch/merch02.webp",
    },
    {
        "name": "RECON 2026 Cap",
        "description": "Structured snapback with embroidered RECON 2026 badge for long on-campus ops.",
        "point_cost": 1300,
        "stock": 60,
        "photo_key": "/merch/ReCon_Caps3DRender.webp",
    },
    {
        "name": "RECON 2026 Stickers (2-Pack)",
        "description": "Two-piece holographic sticker pack with RECON insignia and tactical event marks.",
        "point_cost": 400,
        "stock": 200,
        "photo_key": "/merch/Stickers3DRender.webp",
    },
    {
        "name": "Caido 3-Month Subscription",
        "description": "One 3-month Caido subscription reward code for advanced web security testing workflows.",
        "point_cost": 1500,
        "stock": 1,
        "photo_key": "/logos/caido.webp",
    },
    {
        "name": "Cybersecurity Book",
        "description": "One curated cybersecurity book reward from the merch desk book pool.",
        "point_cost": 1000,
        "stock": 10,
        "photo_key": None,
    },
]


def upgrade() -> None:
    for short_name, reward in ZONE_REWARDS.items():
        registration_required = short_name not in {"ART", "GAMING"}
        op.execute(
            f"""
            UPDATE zones
            SET
                points = {reward},
                registration_required = {str(registration_required).upper()},
                registration_points = 0,
                check_in_points = {reward},
                is_active = TRUE
            WHERE lower(short_name) = lower('{_quote(short_name)}')
            """
        )

    canonical_names = ", ".join(f"'{_quote(str(item['name']))}'" for item in SHOP_ITEMS)
    op.execute(
        f"""
        UPDATE shop_items
        SET is_active = FALSE
        WHERE name NOT IN ({canonical_names})
        """
    )

    for item in SHOP_ITEMS:
        photo_key_sql = (
            f"'{_quote(str(item['photo_key']))}'"
            if item["photo_key"] is not None
            else "NULL"
        )
        op.execute(
            f"""
            UPDATE shop_items
            SET
                description = '{_quote(str(item['description']))}',
                point_cost = {int(item['point_cost'])},
                stock = {int(item['stock'])},
                photo_key = {photo_key_sql},
                is_active = TRUE
            WHERE name = '{_quote(str(item['name']))}'
            """
        )
        op.execute(
            f"""
            INSERT INTO shop_items (
                id,
                name,
                description,
                point_cost,
                stock,
                is_active,
                photo_key
            )
            SELECT
                gen_random_uuid(),
                '{_quote(str(item['name']))}',
                '{_quote(str(item['description']))}',
                {int(item['point_cost'])},
                {int(item['stock'])},
                TRUE,
                {photo_key_sql}
            WHERE NOT EXISTS (
                SELECT 1 FROM shop_items WHERE name = '{_quote(str(item['name']))}'
            )
            """
        )


def downgrade() -> None:
    canonical_names = ", ".join(f"'{_quote(str(item['name']))}'" for item in SHOP_ITEMS)
    op.execute(f"DELETE FROM shop_items WHERE name IN ({canonical_names})")
