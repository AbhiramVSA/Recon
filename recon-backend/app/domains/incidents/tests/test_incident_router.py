import uuid

import pytest

from app.domains.auth.models import ROLE_ADMIN
from app.domains.incidents.models import Incident, IncidentSeverity, IncidentStatus


async def _create_incident(session_factory, *, title: str = "Test issue") -> Incident:
    async with session_factory() as session:
        incident = Incident(
            title=title,
            description="Testing incident updates",
            severity=IncidentSeverity.low,
            status=IncidentStatus.open,
        )
        session.add(incident)
        await session.commit()
        await session.refresh(incident)
        return incident


@pytest.mark.asyncio
async def test_admin_can_update_incident_status_and_resolution_notes(
    client, auth_override, create_user, session_factory
):
    admin = await create_user(role_name=ROLE_ADMIN, email="incident-admin@example.com", username="incidentadmin")
    auth_override(admin)
    incident = await _create_incident(session_factory)

    response = await client.patch(
        f"/api/v1/incidents/{incident.id}",
        json={"status": "resolved", "resolution_notes": "Handled by ops"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "resolved"
    assert data["resolution_notes"] == "Handled by ops"
    assert data["resolved_at"] is not None


@pytest.mark.asyncio
async def test_update_incident_rejects_unknown_assignee_with_404(
    client, auth_override, create_user, session_factory
):
    admin = await create_user(role_name=ROLE_ADMIN, email="incident-admin-2@example.com", username="incidentadmin2")
    auth_override(admin)
    incident = await _create_incident(session_factory, title="Unknown assignee")

    response = await client.patch(
        f"/api/v1/incidents/{incident.id}",
        json={"assigned_to": str(uuid.uuid4())},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Assigned user not found"}


@pytest.mark.asyncio
async def test_update_incident_assigns_existing_user(
    client, auth_override, create_user, session_factory
):
    admin = await create_user(role_name=ROLE_ADMIN, email="incident-admin-3@example.com", username="incidentadmin3")
    assignee = await create_user(email="incident-assignee@example.com", username="incidentassignee")
    auth_override(admin)
    incident = await _create_incident(session_factory, title="Known assignee")

    response = await client.patch(
        f"/api/v1/incidents/{incident.id}",
        json={"assigned_to": str(assignee.id), "status": "acknowledged"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "acknowledged"
    assert data["assigned_to"] == str(assignee.id)


@pytest.mark.asyncio
async def test_reopening_resolved_incident_clears_resolved_at(
    client, auth_override, create_user, session_factory
):
    admin = await create_user(role_name=ROLE_ADMIN, email="incident-admin-4@example.com", username="incidentadmin4")
    auth_override(admin)
    incident = await _create_incident(session_factory, title="Reopen incident")

    resolve_response = await client.patch(
        f"/api/v1/incidents/{incident.id}",
        json={"status": "resolved", "resolution_notes": "Handled by ops"},
    )
    assert resolve_response.status_code == 200
    assert resolve_response.json()["resolved_at"] is not None

    reopen_response = await client.patch(
        f"/api/v1/incidents/{incident.id}",
        json={"status": "acknowledged"},
    )

    assert reopen_response.status_code == 200
    data = reopen_response.json()
    assert data["status"] == "acknowledged"
    assert data["resolved_at"] is None
