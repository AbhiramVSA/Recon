import pytest

from app.domains.auth.models import ROLE_ADMIN
from app.domains.treasure_hunt.models import TreasureHuntProblem
from app.domains.treasure_hunt.seed_data import TREASURE_HUNT_PROBLEM_SEED
from app.domains.treasure_hunt.service import compute_route_hash

FLAG_BY_SLUG = {
    "dancing-men": "ELEMENTARY MY DEAR WATSON",
    "unown-pokemon-alphabet": "THE DARK KNIGHT ALWAYS RISES",
    "semaphore-trousers-cipher": "ONE DOES NOT SIMPLY WALK",
    "lunar-alphabet": "KEEP YOUR FRIENDS CLOSE",
    "braile-decode": "BRAILLE DECODE SUCCESS",
    "qr-code": "HIDDEN IN PLAIN SIGHT",
    "satellite-intercept": "EXIF FOUND HOSTEL TRACE",
    "nokia-3310-lost-signals": "NOKIA IS GOATED ICL",
}


async def _create_participant(client, auth_override, user, display_name: str) -> str:
    auth_override(user)
    response = await client.post(
        "/api/v1/participants/me",
        json={"display_name": display_name, "institution": "VIT-AP", "year": 2},
    )
    assert response.status_code == 201
    return response.json()["id"]


async def _create_team(client, auth_override, user, name: str) -> dict:
    auth_override(user)
    response = await client.post("/api/v1/teams/", json={"name": name})
    assert response.status_code == 201
    return response.json()


async def _seed_catalog(session_factory) -> dict[str, TreasureHuntProblem]:
    async with session_factory() as session:
        seeded: dict[str, TreasureHuntProblem] = {}
        for row in TREASURE_HUNT_PROBLEM_SEED:
            problem = TreasureHuntProblem(**row)
            session.add(problem)
            await session.flush()
            seeded[str(row["slug"])] = problem
        await session.commit()
        return seeded


@pytest.mark.asyncio
async def test_scan_and_submit_correct_flag_updates_progress(
    client, auth_override, create_user, session_factory
):
    seeded = await _seed_catalog(session_factory)
    user = await create_user(email="hunter@example.com", username="hunter")
    await _create_participant(client, auth_override, user, "hunter-one")
    await _create_team(client, auth_override, user, "Signal Seekers")

    auth_override(user)
    scanned = await client.get("/api/v1/treasure-hunt/scan/th-01-dancing-men")
    assert scanned.status_code == 200
    assert scanned.json()["slug"] == "dancing-men"
    assert scanned.json()["already_solved"] is False
    assert scanned.json()["route_hash"] == compute_route_hash("th-01-dancing-men")

    problem_id = str(seeded["dancing-men"].id)
    submit = await client.post(
        f"/api/v1/treasure-hunt/problems/{problem_id}/submit",
        json={
            "flag": "ELEMENTARY MY DEAR WATSON",
            "idempotency_key": "hunt-solve-1",
        },
    )
    assert submit.status_code == 200
    assert submit.json()["status"] == "solved"
    assert submit.json()["solved_count"] == 1
    assert (
        submit.json()["next_hint"]
        == "The flaws weren't in the tools. They were in the applications."
    )

    progress = await client.get("/api/v1/treasure-hunt/me/progress")
    assert progress.status_code == 200
    body = progress.json()
    assert body["solved_count"] == 1
    assert body["remaining_count"] == 7
    assert body["leaderboard_rank"] == 1
    solved = {item["slug"]: item["solved"] for item in body["problems"]}
    assert solved["dancing-men"] is True

    team_points = await client.get("/api/v1/points/team-events/me")
    assert team_points.status_code == 200
    assert team_points.json()["normalized_points"] == 20
    assert team_points.json()["event_summaries"] == [
        {
            "event_key": "treasure_hunt",
            "normalized_points": 20,
            "raw_score_total": 100,
        }
    ]


@pytest.mark.asyncio
async def test_duplicate_submit_is_idempotent_for_same_team_and_problem(
    client, auth_override, create_user, session_factory
):
    seeded = await _seed_catalog(session_factory)
    user = await create_user(email="idem-hunt@example.com", username="idemhunt")
    await _create_participant(client, auth_override, user, "idem-hunter")
    await _create_team(client, auth_override, user, "Idem Squad")

    auth_override(user)
    problem_id = str(seeded["unown-pokemon-alphabet"].id)
    payload = {
        "flag": "THE DARK KNIGHT ALWAYS RISES",
        "idempotency_key": "hunt-idem-1",
    }
    first = await client.post(f"/api/v1/treasure-hunt/problems/{problem_id}/submit", json=payload)
    second = await client.post(f"/api/v1/treasure-hunt/problems/{problem_id}/submit", json=payload)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["status"] == "solved"
    assert second.json()["status"] == "already_solved"

    progress = await client.get("/api/v1/treasure-hunt/me/progress")
    assert progress.json()["solved_count"] == 1


@pytest.mark.asyncio
async def test_incorrect_flag_does_not_increment_progress_or_create_finish(
    client, auth_override, create_user, session_factory
):
    seeded = await _seed_catalog(session_factory)
    user = await create_user(email="wrong-flag@example.com", username="wrongflag")
    await _create_participant(client, auth_override, user, "wrong-flag")
    await _create_team(client, auth_override, user, "Wrong Flaggers")

    auth_override(user)
    problem_id = str(seeded["semaphore-trousers-cipher"].id)
    submit = await client.post(
        f"/api/v1/treasure-hunt/problems/{problem_id}/submit",
        json={
            "flag": "RECON{WRONG_FLAG}",
            "idempotency_key": "hunt-wrong-1",
        },
    )

    assert submit.status_code == 200
    assert submit.json()["status"] == "incorrect"
    assert submit.json()["correct"] is False
    assert submit.json()["solved_count"] == 0
    assert submit.json()["finish_rank"] is None
    assert submit.json()["next_hint"] is None

    progress = await client.get("/api/v1/treasure-hunt/me/progress")
    assert progress.status_code == 200
    assert progress.json()["solved_count"] == 0
    assert progress.json()["completed_at"] is None


@pytest.mark.asyncio
async def test_same_idempotency_key_on_different_problem_conflicts(
    client, auth_override, create_user, session_factory
):
    seeded = await _seed_catalog(session_factory)
    user = await create_user(email="idem-conflict@example.com", username="idemconflict")
    await _create_participant(client, auth_override, user, "idem-conflict")
    await _create_team(client, auth_override, user, "Conflict Squad")

    auth_override(user)
    first_problem_id = str(seeded["dancing-men"].id)
    second_problem_id = str(seeded["unown-pokemon-alphabet"].id)
    idem = "hunt-conflict-1"

    first = await client.post(
        f"/api/v1/treasure-hunt/problems/{first_problem_id}/submit",
        json={"flag": FLAG_BY_SLUG["dancing-men"], "idempotency_key": idem},
    )
    second = await client.post(
        f"/api/v1/treasure-hunt/problems/{second_problem_id}/submit",
        json={"flag": FLAG_BY_SLUG["unown-pokemon-alphabet"], "idempotency_key": idem},
    )

    assert first.status_code == 200
    assert second.status_code == 409
    assert second.json()["detail"] == "idempotency_key already exists for a different solve request"


@pytest.mark.asyncio
async def test_first_four_finishers_are_recorded_in_order(
    client, auth_override, create_user, session_factory
):
    seeded = await _seed_catalog(session_factory)
    slugs_in_order = [row["slug"] for row in TREASURE_HUNT_PROBLEM_SEED]

    users = []
    for index in range(5):
        user = await create_user(
            email=f"finisher-{index}@example.com",
            username=f"finisher{index}",
        )
        users.append(user)
        await _create_participant(client, auth_override, user, f"finisher-{index}")
        await _create_team(client, auth_override, user, f"Finish Team {index}")

    for index, user in enumerate(users):
        auth_override(user)
        for solve_index, slug in enumerate(slugs_in_order):
            problem_id = str(seeded[str(slug)].id)
            response = await client.post(
                f"/api/v1/treasure-hunt/problems/{problem_id}/submit",
                json={
                    "flag": FLAG_BY_SLUG[str(slug)],
                    "idempotency_key": f"finish-{index}-{solve_index}",
                },
            )
            assert response.status_code == 200

    auth_override(users[0])
    finishers = await client.get("/api/v1/treasure-hunt/finishers")
    assert finishers.status_code == 200
    entries = finishers.json()["entries"]
    assert len(entries) == 4
    assert [entry["finish_rank"] for entry in entries] == [1, 2, 3, 4]
    assert {entry["team_name"] for entry in entries} == {
        "Finish Team 0",
        "Finish Team 1",
        "Finish Team 2",
        "Finish Team 3",
    }

    leaderboard = await client.get("/api/v1/treasure-hunt/leaderboard")
    assert leaderboard.status_code == 200
    assert leaderboard.json()["entries"][0]["solved_count"] == 8
    fifth = [entry for entry in leaderboard.json()["entries"] if entry["team_name"] == "Finish Team 4"][0]
    assert fifth["solved_count"] == 8
    assert fifth["finish_rank"] is None


@pytest.mark.asyncio
async def test_scan_requires_team_membership(client, auth_override, create_user, session_factory):
    await _seed_catalog(session_factory)
    user = await create_user(email="scan-no-team@example.com", username="scannoteam")
    await _create_participant(client, auth_override, user, "scan-no-team")

    auth_override(user)
    response = await client.get("/api/v1/treasure-hunt/scan/th-01-dancing-men")
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant is not part of a team"


@pytest.mark.asyncio
async def test_scan_by_route_hash_resolves_problem(
    client, auth_override, create_user, session_factory
):
    await _seed_catalog(session_factory)
    user = await create_user(email="scan-by-hash@example.com", username="scanbyhash")
    await _create_participant(client, auth_override, user, "scan-by-hash")
    await _create_team(client, auth_override, user, "Hash Team")

    auth_override(user)
    route_hash = compute_route_hash("th-02-unown-pokemon-alphabet")
    response = await client.get(f"/api/v1/treasure-hunt/scan/routes/{route_hash}")

    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == "unown-pokemon-alphabet"
    assert body["route_hash"] == route_hash


@pytest.mark.asyncio
async def test_admin_can_read_leaderboard_and_finishers_without_participant_profile(
    client, auth_override, create_user, session_factory
):
    seeded = await _seed_catalog(session_factory)
    participant_user = await create_user(email="board-reader@example.com", username="boardreader")
    admin_user = await create_user(role_name=ROLE_ADMIN, email="board-admin@example.com", username="boardadmin")
    await _create_participant(client, auth_override, participant_user, "board-runner")
    await _create_team(client, auth_override, participant_user, "Board Team")

    auth_override(participant_user)
    problem_id = str(seeded["dancing-men"].id)
    solved = await client.post(
        f"/api/v1/treasure-hunt/problems/{problem_id}/submit",
        json={"flag": FLAG_BY_SLUG["dancing-men"], "idempotency_key": "admin-board-1"},
    )
    assert solved.status_code == 200

    auth_override(admin_user)
    leaderboard = await client.get("/api/v1/treasure-hunt/leaderboard")
    finishers = await client.get("/api/v1/treasure-hunt/finishers")

    assert leaderboard.status_code == 200
    assert finishers.status_code == 200
    assert leaderboard.json()["entries"][0]["team_name"] == "Board Team"
