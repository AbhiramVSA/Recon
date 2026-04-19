import pytest

from app.domains.auth.models import ROLE_ADMIN


async def _create_participant(client, auth_override, user, display_name: str):
    auth_override(user)
    response = await client.post(
        "/api/v1/participants/me",
        json={"display_name": display_name, "institution": "VIT-AP", "year": 2},
    )
    assert response.status_code == 201
    return response.json()["id"]


@pytest.mark.asyncio
async def test_create_team_and_fetch_my_team(client, auth_override, create_user):
    user = await create_user(email="team-owner@example.com", username="teamowner")
    await _create_participant(client, auth_override, user, "team-owner")

    auth_override(user)
    create_team = await client.post("/api/v1/teams/", json={"name": "Zero Cool"})

    assert create_team.status_code == 201
    data = create_team.json()
    assert data["name"] == "Zero Cool"
    assert len(data["invite_code"]) == 6
    assert len(data["members"]) == 1
    assert data["members"][0]["display_name"] == "team-owner"

    my_team = await client.get("/api/v1/teams/me")
    assert my_team.status_code == 200
    assert my_team.json()["id"] == data["id"]


@pytest.mark.asyncio
async def test_join_team_with_invite_code(client, auth_override, create_user):
    owner = await create_user(email="team-lead@example.com", username="teamlead")
    joiner = await create_user(email="team-joiner@example.com", username="teamjoiner")
    await _create_participant(client, auth_override, owner, "lead")
    await _create_participant(client, auth_override, joiner, "joiner")

    auth_override(owner)
    create_team = await client.post("/api/v1/teams/", json={"name": "Packet Ninjas"})
    invite_code = create_team.json()["invite_code"]

    auth_override(joiner)
    join_team = await client.post("/api/v1/teams/join", json={"invite_code": invite_code})

    assert join_team.status_code == 200
    names = {member["display_name"] for member in join_team.json()["members"]}
    assert names == {"lead", "joiner"}


@pytest.mark.asyncio
async def test_join_team_normalizes_pasted_invite_code(client, auth_override, create_user):
    owner = await create_user(email="team-normalize-owner@example.com", username="teamnormalizeowner")
    joiner = await create_user(email="team-normalize-joiner@example.com", username="teamnormalizejoiner")
    await _create_participant(client, auth_override, owner, "normalize-lead")
    await _create_participant(client, auth_override, joiner, "normalize-joiner")

    auth_override(owner)
    create_team = await client.post("/api/v1/teams/", json={"name": "Normalize Crew"})
    invite_code = create_team.json()["invite_code"]

    auth_override(joiner)
    join_team = await client.post("/api/v1/teams/join", json={"invite_code": f"  {invite_code.lower()}  "})

    assert join_team.status_code == 200
    assert {member["display_name"] for member in join_team.json()["members"]} == {
        "normalize-lead",
        "normalize-joiner",
    }


@pytest.mark.asyncio
async def test_participant_cannot_use_self_service_twice_even_after_admin_removal(
    client, auth_override, create_user
):
    admin = await create_user(
        role_name=ROLE_ADMIN,
        email="team-admin-lock@example.com",
        username="teamadminlock",
    )
    owner = await create_user(email="team-lock-owner@example.com", username="teamlockowner")
    other = await create_user(email="team-lock-other@example.com", username="teamlockother")

    owner_participant_id = await _create_participant(client, auth_override, owner, "owner-lock")
    await _create_participant(client, auth_override, other, "other-lock")

    auth_override(owner)
    first_team = await client.post("/api/v1/teams/", json={"name": "First Team"})
    assert first_team.status_code == 201

    auth_override(other)
    second_team = await client.post("/api/v1/teams/", json={"name": "Second Team"})
    assert second_team.status_code == 201
    invite_code = second_team.json()["invite_code"]

    auth_override(admin)
    removal = await client.put(
        f"/api/v1/teams/admin/participants/{owner_participant_id}/team",
        json={"target_team_id": None},
    )
    assert removal.status_code == 200
    assert removal.json()["team_id"] is None

    auth_override(owner)
    join_attempt = await client.post("/api/v1/teams/join", json={"invite_code": invite_code})
    assert join_attempt.status_code == 409
    assert "self-service has already been used" in join_attempt.json()["detail"]


@pytest.mark.asyncio
async def test_join_team_rejects_unknown_invite_code(client, auth_override, create_user):
    user = await create_user(email="unknown-invite@example.com", username="unknowninvite")
    await _create_participant(client, auth_override, user, "unknown-invite")

    auth_override(user)
    response = await client.post("/api/v1/teams/join", json={"invite_code": "NOPE12"})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_admin_team_crud_and_member_assignment(client, auth_override, create_user):
    admin = await create_user(
        role_name=ROLE_ADMIN,
        email="team-admin-manage@example.com",
        username="teamadminmanage",
    )
    player_a = await create_user(email="team-admin-a@example.com", username="teamadmina")
    player_b = await create_user(email="team-admin-b@example.com", username="teamadminb")

    participant_a = await _create_participant(client, auth_override, player_a, "alpha-admin")
    participant_b = await _create_participant(client, auth_override, player_b, "beta-admin")

    auth_override(admin)
    created = await client.post(
        "/api/v1/teams/admin",
        json={
            "name": "Ops Allocated",
            "member_participant_ids": [participant_a],
        },
    )
    assert created.status_code == 201
    team_id = created.json()["id"]
    assert {member["display_name"] for member in created.json()["members"]} == {"alpha-admin"}

    listing = await client.get("/api/v1/teams/admin")
    assert listing.status_code == 200
    assert any(team["id"] == team_id for team in listing.json()["teams"])

    reassigned = await client.put(
        f"/api/v1/teams/admin/participants/{participant_b}/team",
        json={"target_team_id": team_id},
    )
    assert reassigned.status_code == 200
    assert reassigned.json()["team_id"] == team_id

    updated = await client.patch(
        f"/api/v1/teams/admin/{team_id}",
        json={"name": "Ops Final", "regenerate_invite_code": True},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Ops Final"
    assert {member["display_name"] for member in updated.json()["members"]} == {
        "alpha-admin",
        "beta-admin",
    }

    fetched = await client.get(f"/api/v1/teams/admin/{team_id}")
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "Ops Final"

    removed = await client.put(
        f"/api/v1/teams/admin/participants/{participant_a}/team",
        json={"target_team_id": None},
    )
    assert removed.status_code == 200
    assert removed.json()["team_id"] is None

    removed_b = await client.put(
        f"/api/v1/teams/admin/participants/{participant_b}/team",
        json={"target_team_id": None},
    )
    assert removed_b.status_code == 200

    deleted = await client.delete(f"/api/v1/teams/admin/{team_id}")
    assert deleted.status_code == 204


@pytest.mark.asyncio
async def test_admin_cannot_delete_team_with_competition_history(
    client, auth_override, create_user
):
    admin = await create_user(
        role_name=ROLE_ADMIN,
        email="team-admin-history@example.com",
        username="teamadminhistory",
    )
    player = await create_user(email="team-history@example.com", username="teamhistory")

    await _create_participant(client, auth_override, player, "history-player")
    auth_override(player)
    created_team = await client.post("/api/v1/teams/", json={"name": "History Team"})
    assert created_team.status_code == 201
    team_id = created_team.json()["id"]

    auth_override(admin)
    award = await client.post(
        "/api/v1/points/team-events/award-delta",
        json={
            "team_id": team_id,
            "event_key": "koth",
            "round_key": "round-1",
            "raw_score_delta": 30,
            "raw_score_ceiling": 300,
            "normalized_points_ceiling": 300,
            "source": "koth.tick",
            "idempotency_key": "team-history-delta-1",
        },
    )
    assert award.status_code == 201

    deleted = await client.delete(f"/api/v1/teams/admin/{team_id}")
    assert deleted.status_code == 409
    assert "competition history" in deleted.json()["detail"]
