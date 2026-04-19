import pytest

from app.domains.auth.models import ROLE_ADMIN, ROLE_PARTICIPANT, ROLE_PARTNER


@pytest.mark.asyncio
async def test_create_user_requires_admin(client, auth_override, create_user):
    participant = await create_user(
        role_name=ROLE_PARTICIPANT,
        email="user-route-participant@example.com",
        username="userrouteparticipant",
    )
    auth_override(participant)

    response = await client.post(
        "/api/v1/users/",
        json={
            "email": "created-by-participant@example.com",
            "username": "createdbyparticipant",
            "password": "super-secret",
        },
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_create_user_accepts_role_name(client, auth_override, create_user):
    admin = await create_user(
        role_name=ROLE_ADMIN,
        email="user-route-admin@example.com",
        username="userrouteadmin",
    )
    auth_override(admin)

    response = await client.post(
        "/api/v1/users/",
        json={
            "email": "partner-created@example.com",
            "username": "partnercreated",
            "password": "super-secret",
            "role_name": ROLE_PARTNER,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["email"] == "partner-created@example.com"
    assert payload["role"]["name"] == ROLE_PARTNER
