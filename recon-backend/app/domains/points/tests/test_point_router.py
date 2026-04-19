import uuid

import pytest

from app.domains.auth.models import ROLE_ADMIN


async def _create_participant(client, auth_override, user, display_name: str) -> uuid.UUID:
    auth_override(user)
    response = await client.post(
        "/api/v1/participants/me",
        json={
            "display_name": display_name,
            "institution": "VIT-AP",
            "year": 2,
        },
    )
    assert response.status_code == 201
    return uuid.UUID(response.json()["id"])


async def _create_team(client, auth_override, user, name: str) -> dict:
    auth_override(user)
    response = await client.post("/api/v1/teams/", json={"name": name})
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_award_points_and_get_my_balance(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_1@example.com", username="adminp1")
    player = await create_user(email="player_points_1@example.com", username="playerp1")
    participant_id = await _create_participant(client, auth_override, player, "ranker1")

    auth_override(admin)
    award_response = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": 120,
            "reason": "zone.lock_hunt.complete",
            "idempotency_key": "award-1",
        },
    )
    assert award_response.status_code == 201
    assert award_response.json()["resulting_balance"] == 120
    assert award_response.json()["transaction"]["resulting_balance"] == 120

    auth_override(player)
    me_response = await client.get("/api/v1/points/me")
    assert me_response.status_code == 200
    assert me_response.json()["balance"] == 120
    assert len(me_response.json()["recent_transactions"]) == 1


@pytest.mark.asyncio
async def test_spend_cannot_push_balance_negative(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_2@example.com", username="adminp2")
    player = await create_user(email="player_points_2@example.com", username="playerp2")
    participant_id = await _create_participant(client, auth_override, player, "ranker2")

    auth_override(admin)
    earn = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": 50,
            "reason": "schedule.session.attend",
            "idempotency_key": "spend-guard-earn-1",
        },
    )
    assert earn.status_code == 201

    spend = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": -60,
            "reason": "shop.redeem",
            "idempotency_key": "spend-guard-spend-1",
        },
    )
    assert spend.status_code == 409
    assert spend.json()["detail"] == "Insufficient points balance"


@pytest.mark.asyncio
async def test_idempotency_key_prevents_duplicate_mutations(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_3@example.com", username="adminp3")
    player = await create_user(email="player_points_3@example.com", username="playerp3")
    participant_id = await _create_participant(client, auth_override, player, "ranker3")

    auth_override(admin)
    payload = {
        "participant_id": str(participant_id),
        "amount": 40,
        "reason": "zone.lock_hunt.complete",
        "idempotency_key": "stable-award-3",
    }

    first = await client.post("/api/v1/points/award", json=payload)
    second = await client.post("/api/v1/points/award", json=payload)

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["transaction"]["id"] == second.json()["transaction"]["id"]
    assert second.json()["resulting_balance"] == 40

    auth_override(player)
    me = await client.get("/api/v1/points/me")
    assert me.status_code == 200
    assert me.json()["balance"] == 40
    assert len(me.json()["recent_transactions"]) == 1


@pytest.mark.asyncio
async def test_leaderboard_and_my_rank(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_4@example.com", username="adminp4")
    p1 = await create_user(email="player_points_4a@example.com", username="playerp4a")
    p2 = await create_user(email="player_points_4b@example.com", username="playerp4b")
    p3 = await create_user(email="player_points_4c@example.com", username="playerp4c")

    id1 = await _create_participant(client, auth_override, p1, "alpha")
    id2 = await _create_participant(client, auth_override, p2, "beta")
    id3 = await _create_participant(client, auth_override, p3, "gamma")

    auth_override(admin)
    for participant_id, amount, idem in (
        (id1, 90, "board-1"),
        (id2, 60, "board-2"),
        (id3, 30, "board-3"),
    ):
        response = await client.post(
            "/api/v1/points/award",
            json={
                "participant_id": str(participant_id),
                "amount": amount,
                "reason": "zone.lock_hunt.complete",
                "idempotency_key": idem,
            },
        )
        assert response.status_code == 201

    auth_override(p1)
    leaderboard = await client.get("/api/v1/points/leaderboard?skip=0&limit=2")
    assert leaderboard.status_code == 200
    assert leaderboard.json()["total_ranked"] == 3
    assert leaderboard.json()["entries"][0]["display_name"] == "alpha"
    assert leaderboard.json()["entries"][1]["display_name"] == "beta"

    auth_override(p2)
    my_rank = await client.get("/api/v1/points/leaderboard/me")
    assert my_rank.status_code == 200
    assert my_rank.json()["rank"] == 2
    assert my_rank.json()["points"] == 60


@pytest.mark.asyncio
async def test_leaderboard_me_rank_matches_ordered_leaderboard_for_ties(
    client, auth_override, create_user
):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_6@example.com", username="adminp6")
    p1 = await create_user(email="player_points_6a@example.com", username="playerp6a")
    p2 = await create_user(email="player_points_6b@example.com", username="playerp6b")

    id1 = await _create_participant(client, auth_override, p1, "tied-a")
    id2 = await _create_participant(client, auth_override, p2, "tied-b")

    auth_override(admin)
    for participant_id, idem in ((id1, "tie-1"), (id2, "tie-2")):
        response = await client.post(
            "/api/v1/points/award",
            json={
                "participant_id": str(participant_id),
                "amount": 100,
                "reason": "zone.lock_hunt.complete",
                "idempotency_key": idem,
            },
        )
        assert response.status_code == 201

    board = await client.get("/api/v1/points/leaderboard?skip=0&limit=10")
    assert board.status_code == 200
    entries = board.json()["entries"]
    assert len(entries) == 2

    by_participant = {entry["participant_id"]: entry["rank"] for entry in entries}
    assert by_participant[str(id1)] in (1, 2)
    assert by_participant[str(id2)] in (1, 2)
    assert by_participant[str(id1)] != by_participant[str(id2)]

    auth_override(p1)
    p1_rank = await client.get("/api/v1/points/leaderboard/me")
    auth_override(p2)
    p2_rank = await client.get("/api/v1/points/leaderboard/me")
    assert p1_rank.status_code == 200
    assert p2_rank.status_code == 200
    assert p1_rank.json()["rank"] == by_participant[str(id1)]
    assert p2_rank.json()["rank"] == by_participant[str(id2)]


@pytest.mark.asyncio
async def test_idempotency_key_conflict_for_different_payload_returns_409(
    client, auth_override, create_user
):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_7@example.com", username="adminp7")
    p1 = await create_user(email="player_points_7a@example.com", username="playerp7a")
    p2 = await create_user(email="player_points_7b@example.com", username="playerp7b")

    id1 = await _create_participant(client, auth_override, p1, "idem-a")
    id2 = await _create_participant(client, auth_override, p2, "idem-b")

    auth_override(admin)
    first = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(id1),
            "amount": 25,
            "reason": "zone.lock_hunt.complete",
            "idempotency_key": "shared-idem-key-1",
        },
    )
    assert first.status_code == 201

    conflicting = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(id2),
            "amount": 25,
            "reason": "zone.lock_hunt.complete",
            "idempotency_key": "shared-idem-key-1",
        },
    )
    assert conflicting.status_code == 409
    assert conflicting.json()["detail"] == "idempotency_key already exists for a different payload"


@pytest.mark.asyncio
async def test_admin_transactions_requires_admin_and_supports_filters(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_5@example.com", username="adminp5")
    player = await create_user(email="player_points_5@example.com", username="playerp5")
    participant_id = await _create_participant(client, auth_override, player, "delta")

    auth_override(admin)
    await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": 70,
            "reason": "schedule.session.attend",
            "idempotency_key": "admin-tx-1",
        },
    )
    await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": -20,
            "reason": "shop.redeem",
            "idempotency_key": "admin-tx-2",
        },
    )

    auth_override(player)
    forbidden = await client.get("/api/v1/points/transactions")
    assert forbidden.status_code == 403

    auth_override(admin)
    filtered = await client.get("/api/v1/points/transactions?reason=shop.redeem")
    assert filtered.status_code == 200
    assert filtered.json()["total"] == 1
    assert filtered.json()["transactions"][0]["amount"] == -20


@pytest.mark.asyncio
async def test_award_requires_non_blank_idempotency_key(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_8@example.com", username="adminp8")
    player = await create_user(email="player_points_8@example.com", username="playerp8")
    participant_id = await _create_participant(client, auth_override, player, "idem-required")

    auth_override(admin)
    response = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": 10,
            "reason": "zone.lock_hunt.complete",
            "idempotency_key": "   ",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "idempotency_key must not be blank"


@pytest.mark.asyncio
async def test_idempotency_note_mismatch_returns_409(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_9@example.com", username="adminp9")
    player = await create_user(email="player_points_9@example.com", username="playerp9")
    participant_id = await _create_participant(client, auth_override, player, "idem-note")

    auth_override(admin)
    first = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": 20,
            "reason": "zone.lock_hunt.complete",
            "idempotency_key": "idem-note-1",
            "note": "note-a",
        },
    )
    assert first.status_code == 201

    conflicting = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": 20,
            "reason": "zone.lock_hunt.complete",
            "idempotency_key": "idem-note-1",
            "note": "note-b",
        },
    )
    assert conflicting.status_code == 409


@pytest.mark.asyncio
async def test_admin_transactions_rejects_naive_datetimes(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_11@example.com", username="adminp11")
    auth_override(admin)
    response = await client.get("/api/v1/points/transactions?start_at=2026-04-10T10:00:00")
    assert response.status_code == 400
    assert response.json()["detail"] == "start_at must be timezone-aware"


@pytest.mark.asyncio
async def test_award_requires_admin_role(client, auth_override, create_user):
    player = await create_user(email="player_points_14@example.com", username="playerp14")
    participant_id = await _create_participant(client, auth_override, player, "award-admin-only")

    auth_override(player)
    response = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": 10,
            "reason": "zone.lock_hunt.complete",
            "idempotency_key": "non-admin-award-1",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_award_validation_and_missing_participant_paths(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_15@example.com", username="adminp15")
    player = await create_user(email="player_points_15@example.com", username="playerp15")
    participant_id = await _create_participant(client, auth_override, player, "validation-cases")

    auth_override(admin)
    zero_amount = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": 0,
            "reason": "zone.lock_hunt.complete",
            "idempotency_key": "zero-amount-1",
        },
    )
    assert zero_amount.status_code == 400
    assert zero_amount.json()["detail"] == "amount must be non-zero"

    bad_reason = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": 10,
            "reason": "invalidreason",
            "idempotency_key": "bad-reason-1",
        },
    )
    assert bad_reason.status_code == 400
    assert "namespaced code" in bad_reason.json()["detail"]

    missing_participant = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(uuid.uuid4()),
            "amount": 10,
            "reason": "zone.lock_hunt.complete",
            "idempotency_key": "missing-participant-1",
        },
    )
    assert missing_participant.status_code == 404
    assert missing_participant.json()["detail"] == "Participant not found"


@pytest.mark.asyncio
async def test_idempotency_conflict_when_same_key_used_by_different_admin_actor(
    client, auth_override, create_user
):
    admin_a = await create_user(role_name=ROLE_ADMIN, email="admin_points_16a@example.com", username="adminp16a")
    admin_b = await create_user(role_name=ROLE_ADMIN, email="admin_points_16b@example.com", username="adminp16b")
    player = await create_user(email="player_points_16@example.com", username="playerp16")
    participant_id = await _create_participant(client, auth_override, player, "idem-admin-actor")

    payload = {
        "participant_id": str(participant_id),
        "amount": 15,
        "reason": "zone.lock_hunt.complete",
        "idempotency_key": "shared-idem-actor-1",
    }

    auth_override(admin_a)
    first = await client.post("/api/v1/points/award", json=payload)
    assert first.status_code == 201

    auth_override(admin_b)
    second = await client.post("/api/v1/points/award", json=payload)
    assert second.status_code == 409
    assert second.json()["detail"] == "idempotency_key already exists for a different payload"


@pytest.mark.asyncio
async def test_transactions_range_validation_paths(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_17@example.com", username="adminp17")
    auth_override(admin)

    bad_amount_range = await client.get("/api/v1/points/transactions?min_amount=100&max_amount=50")
    assert bad_amount_range.status_code == 400
    assert bad_amount_range.json()["detail"] == "min_amount cannot exceed max_amount"

    bad_time_range = await client.get(
        "/api/v1/points/transactions?start_at=2026-04-10T11:00:00Z&end_at=2026-04-10T10:00:00Z"
    )
    assert bad_time_range.status_code == 400
    assert bad_time_range.json()["detail"] == "start_at cannot exceed end_at"


@pytest.mark.asyncio
async def test_spend_exact_balance_to_zero_is_allowed(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_18@example.com", username="adminp18")
    player = await create_user(email="player_points_18@example.com", username="playerp18")
    participant_id = await _create_participant(client, auth_override, player, "exact-zero")

    auth_override(admin)
    earn = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": 50,
            "reason": "schedule.session.attend",
            "idempotency_key": "exact-zero-earn-1",
        },
    )
    assert earn.status_code == 201

    spend = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": -50,
            "reason": "shop.redeem",
            "idempotency_key": "exact-zero-spend-1",
        },
    )
    assert spend.status_code == 201
    assert spend.json()["resulting_balance"] == 0

    auth_override(player)
    me = await client.get("/api/v1/points/me")
    assert me.status_code == 200
    assert me.json()["balance"] == 0


@pytest.mark.asyncio
async def test_leaderboard_requires_authentication(client, create_user):
    response = await client.get("/api/v1/points/leaderboard")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_leaderboard_orders_from_db_projection(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_20@example.com", username="adminp20")
    player_a = await create_user(email="player_points_20a@example.com", username="playerp20a")
    player_b = await create_user(email="player_points_20b@example.com", username="playerp20b")
    participant_a = await _create_participant(client, auth_override, player_a, "projection-a")
    participant_b = await _create_participant(client, auth_override, player_b, "projection-b")

    auth_override(admin)
    for participant_id, amount, idem in (
        (participant_a, 22, "projection-award-1"),
        (participant_b, 11, "projection-award-2"),
    ):
        response = await client.post(
            "/api/v1/points/award",
            json={
                "participant_id": str(participant_id),
                "amount": amount,
                "reason": "zone.lock_hunt.complete",
                "idempotency_key": idem,
            },
        )
        assert response.status_code == 201

    auth_override(player_a)
    board = await client.get("/api/v1/points/leaderboard?skip=0&limit=10")
    assert board.status_code == 200
    entries = board.json()["entries"]
    assert [entry["participant_id"] for entry in entries] == [
        str(participant_a),
        str(participant_b),
    ]

    my_rank = await client.get("/api/v1/points/leaderboard/me")
    assert my_rank.status_code == 200
    assert my_rank.json()["rank"] == 1


@pytest.mark.asyncio
async def test_leaderboard_me_compat_alias_matches_points_endpoint(client, auth_override, create_user):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_22@example.com", username="adminp22")
    player = await create_user(email="player_points_22@example.com", username="playerp22")
    participant_id = await _create_participant(client, auth_override, player, "leaderboard-compat")

    auth_override(admin)
    award = await client.post(
        "/api/v1/points/award",
        json={
            "participant_id": str(participant_id),
            "amount": 77,
            "reason": "zone.lock_hunt.complete",
            "idempotency_key": "leaderboard-compat-award-1",
        },
    )
    assert award.status_code == 201

    auth_override(player)
    canonical = await client.get("/api/v1/points/leaderboard/me")
    compat = await client.get("/api/v1/leaderboard/me")
    assert canonical.status_code == 200
    assert compat.status_code == 200
    assert compat.json() == canonical.json()


@pytest.mark.asyncio
async def test_team_competition_delta_award_updates_team_summary_and_leaderboard(
    client, auth_override, create_user
):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_team_1@example.com", username="adminteam1")
    player = await create_user(email="player_points_team_1@example.com", username="playerteam1")

    await _create_participant(client, auth_override, player, "team-player-1")
    team = await _create_team(client, auth_override, player, "KOTH Crew")

    auth_override(admin)
    award = await client.post(
        "/api/v1/points/team-events/award-delta",
        json={
            "team_id": team["id"],
            "event_key": "koth",
            "round_key": "round-1",
            "raw_score_delta": 60,
            "raw_score_ceiling": 360,
            "normalized_points_ceiling": 300,
            "source": "koth.tick",
            "source_reference": "tick-batch-1",
            "idempotency_key": "team-delta-1",
        },
    )
    assert award.status_code == 201
    assert award.json()["round_score"]["raw_score_total"] == 60
    assert award.json()["round_score"]["normalized_points_total"] == 50

    auth_override(player)
    me = await client.get("/api/v1/points/team-events/me")
    assert me.status_code == 200
    assert me.json()["team_name"] == "KOTH Crew"
    assert me.json()["normalized_points"] == 50
    assert me.json()["event_summaries"] == [
        {
            "event_key": "koth",
            "normalized_points": 50,
            "raw_score_total": 60,
        }
    ]

    board = await client.get("/api/v1/points/team-events/leaderboard")
    assert board.status_code == 200
    assert board.json()["entries"][0]["team_name"] == "KOTH Crew"
    assert board.json()["entries"][0]["normalized_points"] == 50


@pytest.mark.asyncio
async def test_team_competition_snapshot_requires_monotonic_scores_and_explicit_koth_ceiling(
    client, auth_override, create_user
):
    admin = await create_user(role_name=ROLE_ADMIN, email="admin_points_team_2@example.com", username="adminteam2")
    player = await create_user(email="player_points_team_2@example.com", username="playerteam2")

    await _create_participant(client, auth_override, player, "team-player-2")
    team = await _create_team(client, auth_override, player, "CTF Crew")

    auth_override(admin)
    missing_koth_ceiling = await client.post(
        "/api/v1/points/team-events/ingest-snapshot",
        json={
            "team_id": team["id"],
            "event_key": "koth",
            "round_key": "qualifier",
            "raw_score_total": 12,
            "source": "koth.snapshot",
            "source_reference": "snapshot-0",
            "idempotency_key": "team-snapshot-koth-missing-cap",
        },
    )
    assert missing_koth_ceiling.status_code == 400
    assert "raw_score_ceiling is required" in missing_koth_ceiling.json()["detail"]

    first = await client.post(
        "/api/v1/points/team-events/ingest-snapshot",
        json={
            "team_id": team["id"],
            "event_key": "ctf",
            "round_key": "finals",
            "raw_score_total": 4750,
            "source": "ctfd.snapshot",
            "source_reference": "snapshot-1",
            "idempotency_key": "team-snapshot-1",
        },
    )
    assert first.status_code == 201
    assert first.json()["round_score"]["normalized_points_total"] == 250

    lower = await client.post(
        "/api/v1/points/team-events/ingest-snapshot",
        json={
            "team_id": team["id"],
            "event_key": "ctf",
            "round_key": "finals",
            "raw_score_total": 4700,
            "source": "ctfd.snapshot",
            "source_reference": "snapshot-2",
            "idempotency_key": "team-snapshot-2",
        },
    )
    assert lower.status_code == 409
    assert "cannot decrease" in lower.json()["detail"]


@pytest.mark.asyncio
async def test_team_competition_rules_endpoint_is_available_to_authenticated_users(
    client, auth_override, create_user
):
    player = await create_user(email="player_points_team_rules@example.com", username="playerteamrules")
    auth_override(player)
    response = await client.get("/api/v1/points/team-events/rules")
    assert response.status_code == 200
    keys = {rule["event_key"] for rule in response.json()["rules"]}
    assert keys == {"ctf", "koth", "treasure_hunt"}


@pytest.mark.asyncio
async def test_team_competition_settlement_previews_and_mints_participant_points(
    client, auth_override, create_user
):
    admin = await create_user(
        role_name=ROLE_ADMIN,
        email="admin_points_team_settle@example.com",
        username="adminteamsettle",
    )
    player_a = await create_user(email="player_points_team_settle_a@example.com", username="playerteamsettlea")
    player_b = await create_user(email="player_points_team_settle_b@example.com", username="playerteamsettleb")

    participant_a = await _create_participant(client, auth_override, player_a, "settle-a")
    await _create_participant(client, auth_override, player_b, "settle-b")

    team = await _create_team(client, auth_override, player_a, "Settlement Squad")
    auth_override(player_b)
    joined = await client.post("/api/v1/teams/join", json={"invite_code": team["invite_code"]})
    assert joined.status_code == 200

    auth_override(admin)
    awarded = await client.post(
        "/api/v1/points/team-events/ingest-snapshot",
        json={
            "team_id": team["id"],
            "event_key": "ctf",
            "round_key": "finals",
            "raw_score_total": 4750,
            "source": "ctfd.snapshot",
            "source_reference": "settlement-snapshot-1",
            "idempotency_key": "settlement-snapshot-idem-1",
        },
    )
    assert awarded.status_code == 201
    assert awarded.json()["round_score"]["normalized_points_total"] == 250

    preview = await client.post(
        "/api/v1/points/team-events/settlements/preview",
        json={
            "team_id": team["id"],
            "event_key": "ctf",
            "round_key": "finals",
            "participant_points_budget": 7,
        },
    )
    assert preview.status_code == 200
    preview_json = preview.json()
    assert preview_json["participant_points_budget"] == 7
    assert [allocation["allocated_points"] for allocation in preview_json["allocations"]] == [4, 3]

    finalized = await client.post(
        "/api/v1/points/team-events/settlements",
        json={
            "team_id": team["id"],
            "event_key": "ctf",
            "round_key": "finals",
            "participant_points_budget": 7,
            "idempotency_key": "team-settlement-finalize-1",
        },
    )
    assert finalized.status_code == 201
    finalized_json = finalized.json()
    assert finalized_json["source_normalized_points_total"] == 250
    assert [allocation["allocated_points"] for allocation in finalized_json["allocations"]] == [4, 3]

    settlements = await client.get("/api/v1/points/team-events/settlements?event_key=ctf")
    assert settlements.status_code == 200
    assert len(settlements.json()["settlements"]) == 1

    auth_override(player_a)
    me_a = await client.get("/api/v1/points/me")
    assert me_a.status_code == 200
    assert me_a.json()["balance"] == 4

    auth_override(player_b)
    me_b = await client.get("/api/v1/points/me")
    assert me_b.status_code == 200
    assert me_b.json()["balance"] == 3
