import uuid
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import ModeEnum, Settings, settings
from app.domains.auth.models import ROLE_ADMIN, ROLE_PARTICIPANT
from app.domains.auth.service.auth_service import find_or_create_oauth_user
from app.domains.auth.service.user_service import register_user
from app.core.oauth import oauth
from app.db.database import get_db
from app.domains.auth.models import User
from app.domains.auth.service.google_oauth_allowlist_service import clear_google_oauth_allowlist_cache
from app.main import app


@pytest_asyncio.fixture
async def auth_client(session_factory, seeded_roles):
    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        follow_redirects=False,
    ) as async_client:
        yield async_client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_google_login_uses_configured_redirect_uri(auth_client, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_REDIRECT_URI", "https://api.reconhq.tech/api/v1/auth/google/callback")

    async def fake_authorize_redirect(request, redirect_uri):
        from fastapi.responses import JSONResponse

        return JSONResponse({"redirect_uri": redirect_uri})

    monkeypatch.setattr(oauth.google, "authorize_redirect", fake_authorize_redirect)

    response = await auth_client.get("/api/v1/auth/google/login")

    assert response.status_code == 200
    assert response.json()["redirect_uri"] == "https://api.reconhq.tech/api/v1/auth/google/callback"


@pytest.mark.asyncio
async def test_google_callback_redirects_to_configured_frontend(auth_client, monkeypatch):
    monkeypatch.setattr(settings, "FRONTEND_REDIRECT_AFTER_LOGIN", "https://reconhq.tech/auth/callback")

    async def fake_authorize_access_token(request):
        return {"userinfo": {"sub": "google-user-1", "email": "oauth@example.com"}}

    async def fake_handle_oauth_callback(provider, provider_user_id, email, db):
        return User(id=uuid.uuid4(), email=email, username="oauthuser")

    async def fake_issue_tokens(user, response, db):
        response.set_cookie("access_token", "test-access-token")

    monkeypatch.setattr(oauth.google, "authorize_access_token", fake_authorize_access_token)
    monkeypatch.setattr("app.domains.auth.router.auth_router.handle_oauth_callback", fake_handle_oauth_callback)
    monkeypatch.setattr("app.domains.auth.router.auth_router.issue_tokens", fake_issue_tokens)

    response = await auth_client.get("/api/v1/auth/google/callback")

    assert response.status_code == 302
    assert response.headers["location"] == "https://reconhq.tech/auth/callback"
    assert "access_token=test-access-token" in response.headers["set-cookie"]


@pytest.mark.asyncio
async def test_google_callback_allows_email_from_allowlist(auth_client, monkeypatch, tmp_path: Path):
    allowlist = tmp_path / "google_oauth_allowlist.txt"
    allowlist.write_text("allowed@example.com\n", encoding="utf-8")
    monkeypatch.setattr(settings, "GOOGLE_OAUTH_ALLOWLIST_PATH", allowlist)
    monkeypatch.setattr(settings, "FRONTEND_REDIRECT_AFTER_LOGIN", "https://reconhq.tech/auth/callback")
    clear_google_oauth_allowlist_cache()

    async def fake_authorize_access_token(request):
        return {"userinfo": {"sub": "google-user-allowed", "email": "Allowed@Example.com"}}

    async def fake_issue_tokens(user, response, db):
        response.set_cookie("access_token", "test-access-token")

    monkeypatch.setattr(oauth.google, "authorize_access_token", fake_authorize_access_token)
    monkeypatch.setattr("app.domains.auth.router.auth_router.issue_tokens", fake_issue_tokens)

    response = await auth_client.get("/api/v1/auth/google/callback")

    assert response.status_code == 302
    assert response.headers["location"] == "https://reconhq.tech/auth/callback"
    assert "access_token=test-access-token" in response.headers["set-cookie"]
    clear_google_oauth_allowlist_cache()


@pytest.mark.asyncio
async def test_google_callback_rejects_email_outside_allowlist(auth_client, monkeypatch, tmp_path: Path):
    allowlist = tmp_path / "google_oauth_allowlist.txt"
    allowlist.write_text("allowed@example.com\n", encoding="utf-8")
    monkeypatch.setattr(settings, "GOOGLE_OAUTH_ALLOWLIST_PATH", allowlist)
    clear_google_oauth_allowlist_cache()

    async def fake_authorize_access_token(request):
        return {"userinfo": {"sub": "google-user-blocked", "email": "blocked@example.com"}}

    monkeypatch.setattr(oauth.google, "authorize_access_token", fake_authorize_access_token)

    response = await auth_client.get("/api/v1/auth/google/callback")

    assert response.status_code == 403
    assert response.json() == {"detail": "Nice try, but this Google account isn't on the guest list."}
    clear_google_oauth_allowlist_cache()


@pytest.mark.asyncio
async def test_register_user_assigns_admin_role_for_bootstrap_email(session_factory, seeded_roles, monkeypatch):
    monkeypatch.setattr(settings, "BOOTSTRAP_ADMIN_EMAILS", ["bootstrap-admin@example.com"])

    async with session_factory() as session:
        user = await register_user(
            email="bootstrap-admin@example.com",
            username="bootstrapadmin",
            password="secret",
            db=session,
        )

        assert user.role is not None
        assert user.role.name == ROLE_ADMIN


@pytest.mark.asyncio
async def test_oauth_existing_bootstrap_admin_email_is_promoted(session_factory, seeded_roles, create_user, monkeypatch):
    monkeypatch.setattr(settings, "BOOTSTRAP_ADMIN_EMAILS", ["bootstrap-oauth@example.com"])
    monkeypatch.setattr(
        "app.domains.auth.service.auth_service.ensure_google_oauth_email_allowed",
        lambda email: email.strip().lower(),
    )
    await create_user(
        role_name=ROLE_PARTICIPANT,
        email="bootstrap-oauth@example.com",
        username="bootstrapparticipant",
    )

    async with session_factory() as session:
        user = await find_or_create_oauth_user(
            session,
            provider="google",
            provider_user_id="bootstrap-google-user",
            email="bootstrap-oauth@example.com",
        )

        assert user.role is not None
        assert user.role.name == ROLE_ADMIN


def test_settings_build_google_redirect_from_api_base_url():
    config = Settings(
        _env_file=None,
        MODE=ModeEnum.production,
        APP_BASE_URL="https://reconhq.tech",
        API_BASE_URL="https://api.reconhq.tech",
        FRONTEND_REDIRECT_AFTER_LOGIN="https://reconhq.tech/auth/callback",
        ALLOWED_ORIGINS="https://reconhq.tech,https://www.reconhq.tech",
        TRUSTED_HOSTS="api.reconhq.tech,reconhq.tech",
        SESSION_HTTPS_ONLY=True,
    )

    assert config.GOOGLE_REDIRECT_URI == "https://api.reconhq.tech/api/v1/auth/google/callback"


def test_settings_reject_copied_or_localhost_production_urls():
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            MODE=ModeEnum.production,
            APP_BASE_URL="https://reconhq.tech",
            API_BASE_URL="https://api.traction-ai.me",
            FRONTEND_REDIRECT_AFTER_LOGIN="https://reconhq.tech/auth/callback",
            ALLOWED_ORIGINS="https://reconhq.tech",
            TRUSTED_HOSTS="api.reconhq.tech",
            SESSION_HTTPS_ONLY=True,
        )


def test_app_uses_hardened_session_and_trusted_host_middleware():
    session_middleware = next(layer for layer in app.user_middleware if layer.cls is SessionMiddleware)
    trusted_host_middleware = next(
        layer for layer in app.user_middleware if layer.cls is TrustedHostMiddleware
    )

    assert session_middleware.kwargs["session_cookie"] == settings.SESSION_COOKIE_NAME
    assert session_middleware.kwargs["same_site"] == settings.SESSION_SAME_SITE
    assert session_middleware.kwargs["https_only"] == settings.SESSION_HTTPS_ONLY
    assert trusted_host_middleware.kwargs["allowed_hosts"] == settings.TRUSTED_HOSTS


@pytest.mark.asyncio
async def test_unhandled_500_keeps_cors_headers(auth_client, monkeypatch):
    monkeypatch.setattr(settings, "ALLOWED_ORIGINS", ["https://www.reconhq.tech"])

    @app.get("/__test_cors_error")
    async def __test_cors_error():
        raise RuntimeError("boom")

    try:
        transport = ASGITransport(app=app, raise_app_exceptions=False)
        async with AsyncClient(
            transport=transport,
            base_url="http://testserver",
            follow_redirects=False,
        ) as cors_client:
            response = await cors_client.get(
                "/__test_cors_error",
                headers={"Origin": "https://www.reconhq.tech"},
            )
    finally:
        app.router.routes.pop()

    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == "https://www.reconhq.tech"
    assert response.headers["access-control-allow-credentials"] == "true"
