import pytest


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
async def test_participant_cannot_create_second_team_or_join_when_already_member(
    client, auth_override, create_user
):
    owner = await create_user(email="second-owner@example.com", username="secondowner")
    other = await create_user(email="second-other@example.com", username="secondother")
    await _create_participant(client, auth_override, owner, "owner-two")
    await _create_participant(client, auth_override, other, "other-two")

    auth_override(owner)
    create_team = await client.post("/api/v1/teams/", json={"name": "First Team"})
    assert create_team.status_code == 201

    second_team = await client.post("/api/v1/teams/", json={"name": "Second Team"})
    assert second_team.status_code == 409

    auth_override(other)
    other_team = await client.post("/api/v1/teams/", json={"name": "Other Team"})
    invite_code = other_team.json()["invite_code"]

    auth_override(owner)
    join_attempt = await client.post("/api/v1/teams/join", json={"invite_code": invite_code})
    assert join_attempt.status_code == 409


@pytest.mark.asyncio
async def test_join_team_rejects_unknown_invite_code(client, auth_override, create_user):
    user = await create_user(email="unknown-invite@example.com", username="unknowninvite")
    await _create_participant(client, auth_override, user, "unknown-invite")

    auth_override(user)
    response = await client.post("/api/v1/teams/join", json={"invite_code": "NOPE12"})
    assert response.status_code == 404
