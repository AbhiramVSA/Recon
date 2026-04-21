import argparse
import asyncio
import datetime as dt
import re
import secrets
import uuid
from dataclasses import dataclass

from sqlmodel import select

from app.db.database import AsyncSessionLocal
from app.domains.auth.models import Role, User
from app.domains.participants.models import Participant
from app.domains.points.models import ParticipantPoints, PointLedger
from app.domains.teams.models import Team, TeamMembership
from app.domains.zones import crud as zone_crud
from app.domains.zones.models import ZoneCheckIn, ZoneRegistration

SOURCE_SCORES: dict[str, int] = {
    "teamCookie()": 4219,
    "DROWZY": 1826,
    "GHEEKHATAM<3": 1805,
    "Losers": 1653,
    "Error_504": 1251,
    "x86": 1175,
    "DROPOUTS": 955,
    "Two-way": 865,
    "57MSQX": 821,
    "Assailants": 821,
    "TEAM CEASAR": 794,
    "SpaceMonkey": 759,
    "ADMIN": 731,
    "fryingpan.bat": 712,
    "Pathos-II": 669,
    "DECODE-X": 621,
    "NULL_ZERO": 607,
    "Space Pirates": 596,
    "DEFSEC_76": 576,
    "Kannada Awru": 521,
    "First Hack": 470,
    "LEGITBOUNTY": 388,
    "HQIntruders": 388,
    "Salaar": 388,
    "NoName": 388,
    "N RUKSHITH": 388,
    "cipher": 388,
    "TRICK|TREAT": 375,
    "loko_69": 375,
    "abhiramv": 325,
    "Game of Thrones": 325,
    "TEAM CYPHER": 286,
    "Cybers": 275,
    "JUST A TEAM": 250,
    "Crypto Crackers": 250,
    "DIABLO": 250,
    "Dumb&Dumber": 250,
    "BLACK DRAGON": 250,
    "Team KanyaleniRashi": 250,
    "ALGONICS": 200,
    "PlusUltra": 186,
    "kalki": 175,
    "sample": 175,
    "alexander nesso": 175,
    "Bhavya Sri Yeluri": 175,
    "THOR": 150,
    "TEAM GK": 125,
    "abhinavs": 125,
    "doomsday": 125,
    "Akhil": 125,
    "ROMCatz": 125,
    "[ZEBWEB]": 125,
    "SaiPavan": 100,
    "RISHI": 100,
    "0xElite": 100,
    "NTR": 100,
    "Azrael_Wilhelm": 50,
}

ALIASES: dict[str, str] = {
    "57MSQX": "Spiderverse",
    "SpaceMonkey": "SpaceMonkeys",
    "ADMIN": "SHA652",
    "Salaar": "Teamrohan",
    "N RUKSHITH": "SunRiser",
    "loko_69": "eam 33",
    "abhiramv": "beluga",
    "Cybers": "Qenta",
    "Dumb&Dumber": "Dumb&Dumber.exe",
    "ALGONICS": "Nogravity",
    "Bhavya Sri Yeluri": "Syn-Flooders",
    "SaiPavan": "neurovault",
    "RISHI": "TEAM HACK",
    "Azrael_Wilhelm": "Roko's Basilisk",
}


@dataclass
class MemberRow:
    participant_id: object
    email: str


@dataclass
class TeamRow:
    source_name: str
    team: Team
    score: int
    per_member: int
    members: list[MemberRow]


def _norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


async def _build_rows(db) -> tuple[list[TeamRow], list[tuple[str, int]]]:
    teams = list((await db.exec(select(Team))).all())
    team_by_name = {team.name: team for team in teams}
    team_by_norm: dict[str, list[Team]] = {}
    for team in teams:
        team_by_norm.setdefault(_norm(team.name), []).append(team)

    member_rows = (
        await db.exec(
            select(TeamMembership.team_id, Participant.id, User.email)
            .join(Participant, Participant.id == TeamMembership.participant_id)
            .join(User, User.id == Participant.user_id)
        )
    ).all()
    members_by_team: dict[object, list[MemberRow]] = {}
    for team_id, participant_id, email in member_rows:
        members_by_team.setdefault(team_id, []).append(
            MemberRow(participant_id=participant_id, email=email)
        )

    mapped: list[TeamRow] = []
    unmatched: list[tuple[str, int]] = []
    for source_name, score in SOURCE_SCORES.items():
        target_name = ALIASES.get(source_name, source_name)
        team = team_by_name.get(target_name)
        if team is None:
            candidates = team_by_norm.get(_norm(target_name), [])
            if len(candidates) == 1:
                team = candidates[0]
        if team is None:
            unmatched.append((source_name, score))
            continue
        members = members_by_team.get(team.id, [])
        if not members:
            unmatched.append((source_name, score))
            continue

        per_member = int((score / len(members)) + 0.5)
        mapped.append(
            TeamRow(
                source_name=source_name,
                team=team,
                score=score,
                per_member=per_member,
                members=members,
            )
        )

    return mapped, unmatched


async def run(start: int, end: int, apply: bool) -> None:
    async with AsyncSessionLocal() as db:
        admin_rows = (
            await db.exec(
                select(User, Role)
                .join(Role, Role.id == User.role_id)
                .where(Role.name == "admin")
                .order_by(User.created_at.asc())
            )
        ).all()
        if not admin_rows:
            raise RuntimeError("No admin user found")
        admin_user = admin_rows[0][0]

        ctf_zone = await zone_crud.get_zone_by_short_name(db, short_name="CTF")
        if ctf_zone is None:
            raise RuntimeError("CTF zone not found")

        mapped, unmatched = await _build_rows(db)
        sliced = mapped[start:end]
        member_rows = [member for row in sliced for member in row.members]
        participant_ids = [member.participant_id for member in member_rows]
        unique_participant_ids = list(dict.fromkeys(participant_ids))

        print(f"MAPPED_TEAMS_TOTAL={len(mapped)}")
        print(f"BATCH_RANGE={start}:{end}")
        print(f"BATCH_SIZE={len(sliced)}")
        print(f"UNMATCHED_TEAMS={len(unmatched)}")
        for source_name, score in unmatched:
            print(f"UNMATCHED\t{source_name}\t{score}")

        created_awards = 0
        existing_awards = 0
        created_checkins = 0
        existing_checkins = 0

        points_rows = (
            await db.exec(
                select(ParticipantPoints).where(
                    ParticipantPoints.participant_id.in_(unique_participant_ids)
                )
            )
        ).all()
        points_by_participant = {row.participant_id: row for row in points_rows}
        now = dt.datetime.now(dt.timezone.utc)

        if apply:
            for participant_id in unique_participant_ids:
                if participant_id in points_by_participant:
                    continue
                projection = ParticipantPoints(
                    participant_id=participant_id,
                    total_points=0,
                    last_activity_at=now,
                )
                db.add(projection)
                points_by_participant[participant_id] = projection
            await db.flush()

        split_keys: list[str] = []
        for row in sliced:
            for member in row.members:
                split_keys.append(
                    f"ctfsplit26:{row.team.id.hex[:8]}:{str(member.participant_id).replace('-', '')[:20]}"
                )
        existing_split_rows = (
            await db.exec(select(PointLedger.idempotency_key).where(PointLedger.idempotency_key.in_(split_keys)))
        ).all()
        existing_split_keys = set(existing_split_rows)

        for idx, row in enumerate(sliced, 1):
            print(
                f"[{idx}/{len(sliced)}] {row.source_name} => {row.team.name} "
                f"(members={len(row.members)}, score={row.score}, per_member={row.per_member})"
            )
            for member in row.members:
                award_idem = (
                    f"ctfsplit26:{row.team.id.hex[:8]}:"
                    f"{str(member.participant_id).replace('-', '')[:20]}"
                )
                if award_idem not in existing_split_keys:
                    if apply:
                        projection = points_by_participant[member.participant_id]
                        next_balance = projection.total_points + row.per_member
                        ledger_row = PointLedger(
                            id=uuid.uuid4(),
                            participant_id=member.participant_id,
                            amount=row.per_member,
                            reason="ctf.team_split",
                            reference_id=row.team.id,
                            idempotency_key=award_idem,
                            note=(
                                f"CTF split from '{row.source_name}' "
                                f"total={row.score} members={len(row.members)}"
                            ),
                            resulting_balance=next_balance,
                            awarded_by_user_id=admin_user.id,
                        )
                        db.add(ledger_row)
                        projection.total_points = next_balance
                        projection.last_activity_at = now
                        existing_split_keys.add(award_idem)
                    created_awards += 1
                else:
                    existing_awards += 1

        registrations = (
            await db.exec(
                select(ZoneRegistration)
                .where(ZoneRegistration.zone_id == ctf_zone.id)
                .where(ZoneRegistration.participant_id.in_(unique_participant_ids))
            )
        ).all()
        registrations_by_participant = {row.participant_id: row for row in registrations}
        if apply:
            for participant_id in unique_participant_ids:
                if participant_id in registrations_by_participant:
                    continue
                registration = ZoneRegistration(
                    id=uuid.uuid4(),
                    participant_id=participant_id,
                    zone_id=ctf_zone.id,
                    pass_code=secrets.token_urlsafe(18),
                    qr_jti=uuid.uuid4().hex,
                    qr_expires_at=now + dt.timedelta(hours=12),
                    is_active=True,
                    checked_in_at=None,
                    checked_in_by=None,
                )
                db.add(registration)
                registrations_by_participant[participant_id] = registration
            await db.flush()

        registration_ids = [row.id for row in registrations_by_participant.values()]
        checkins = (
            await db.exec(
                select(ZoneCheckIn).where(ZoneCheckIn.registration_id.in_(registration_ids))
            )
        ).all()
        checkins_by_registration = {row.registration_id: row for row in checkins}

        checkin_keys = [f"zone-check-in:{registration_id}" for registration_id in registration_ids]
        existing_checkin_ledger_rows = (
            await db.exec(
                select(PointLedger).where(PointLedger.idempotency_key.in_(checkin_keys))
            )
        ).all()
        checkin_ledger_by_key = {row.idempotency_key: row for row in existing_checkin_ledger_rows}

        for participant_id in unique_participant_ids:
            registration = registrations_by_participant.get(participant_id)
            if registration is None:
                created_checkins += 1
                continue
            check_in = checkins_by_registration.get(registration.id)
            checkin_points_key = f"zone-check-in:{registration.id}"
            checkin_ledger = checkin_ledger_by_key.get(checkin_points_key)
            changed = False

            if check_in is None and apply:
                check_in = ZoneCheckIn(
                    id=uuid.uuid4(),
                    registration_id=registration.id,
                    participant_id=participant_id,
                    zone_id=ctf_zone.id,
                    checked_in_by_user_id=admin_user.id,
                    scanner_device_id="bulk-ctf-award-2026-04-20",
                    scanned_at=now,
                    points_awarded=0,
                    resulting_balance=points_by_participant[participant_id].total_points,
                    point_ledger_entry_id=None,
                )
                db.add(check_in)
                checkins_by_registration[registration.id] = check_in
                changed = True

            if checkin_ledger is None:
                if apply:
                    projection = points_by_participant[participant_id]
                    next_balance = projection.total_points + ctf_zone.check_in_points
                    checkin_ledger = PointLedger(
                        id=uuid.uuid4(),
                        participant_id=participant_id,
                        amount=ctf_zone.check_in_points,
                        reason="zone.event_check_in",
                        reference_id=registration.id,
                        idempotency_key=checkin_points_key,
                        note=f"Zone check-in: {ctf_zone.name}",
                        resulting_balance=next_balance,
                        awarded_by_user_id=admin_user.id,
                    )
                    db.add(checkin_ledger)
                    checkin_ledger_by_key[checkin_points_key] = checkin_ledger
                    projection.total_points = next_balance
                    projection.last_activity_at = now
                    changed = True
            if apply and check_in is not None:
                if check_in.points_awarded != ctf_zone.check_in_points:
                    check_in.points_awarded = ctf_zone.check_in_points
                    changed = True
                if checkin_ledger is not None and check_in.point_ledger_entry_id != checkin_ledger.id:
                    check_in.point_ledger_entry_id = checkin_ledger.id
                    changed = True
                if checkin_ledger is not None and check_in.resulting_balance != checkin_ledger.resulting_balance:
                    check_in.resulting_balance = checkin_ledger.resulting_balance
                    changed = True
                if registration.checked_in_at is None:
                    registration.checked_in_at = check_in.scanned_at
                    changed = True
                if registration.checked_in_by is None:
                    registration.checked_in_by = admin_user.id
                    changed = True
                if not registration.is_active:
                    registration.is_active = True
                    changed = True

            if changed:
                created_checkins += 1
            else:
                existing_checkins += 1

        if not apply:
            await db.rollback()
        else:
            await db.commit()

        print(f"APPLY={int(apply)}")
        print(f"CREATED_AWARDS={created_awards}")
        print(f"EXISTING_AWARDS={existing_awards}")
        print(f"CREATED_CHECKINS={created_checkins}")
        print(f"EXISTING_CHECKINS={existing_checkins}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--end", type=int, default=9999)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    asyncio.run(run(start=args.start, end=args.end, apply=args.apply))


if __name__ == "__main__":
    main()
