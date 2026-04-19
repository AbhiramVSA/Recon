from pathlib import Path
import time

import pytest
from pydantic import ValidationError

from app.core.config import ModeEnum, Settings
from app.core.config import _validate_google_oauth_allowlist_file
from app.domains.auth.service.google_oauth_allowlist_service import (
    clear_google_oauth_allowlist_cache,
    ensure_google_oauth_email_allowed,
    load_google_oauth_allowlist,
)


def test_settings_reject_missing_google_oauth_allowlist_file(tmp_path: Path):
    missing_allowlist = tmp_path / "missing.txt"

    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            MODE=ModeEnum.production,
            APP_BASE_URL="https://reconhq.tech",
            API_BASE_URL="https://api.reconhq.tech",
            FRONTEND_REDIRECT_AFTER_LOGIN="https://reconhq.tech/auth/callback",
            ALLOWED_ORIGINS="https://reconhq.tech,https://www.reconhq.tech",
            TRUSTED_HOSTS="api.reconhq.tech,reconhq.tech",
            SESSION_HTTPS_ONLY=True,
            GOOGLE_OAUTH_ALLOWLIST_PATH=missing_allowlist,
        )


def test_validate_google_oauth_allowlist_file_rejects_empty_file(tmp_path: Path):
    empty_allowlist = tmp_path / "empty.txt"
    empty_allowlist.write_text("# comment only\n\n", encoding="utf-8")

    with pytest.raises(ValueError):
        _validate_google_oauth_allowlist_file(empty_allowlist)


def test_load_google_oauth_allowlist_reloads_when_file_changes(monkeypatch, tmp_path: Path):
    allowlist = tmp_path / "google_oauth_allowlist.txt"
    allowlist.write_text("first@example.com\n", encoding="utf-8")
    monkeypatch.setattr("app.domains.auth.service.google_oauth_allowlist_service.settings.GOOGLE_OAUTH_ALLOWLIST_PATH", allowlist)
    clear_google_oauth_allowlist_cache()

    assert load_google_oauth_allowlist() == {"first@example.com"}

    time.sleep(0.01)
    allowlist.write_text("second@example.com\n", encoding="utf-8")

    assert load_google_oauth_allowlist() == {"second@example.com"}
    clear_google_oauth_allowlist_cache()


def test_ensure_google_oauth_email_allowed_normalizes_case(monkeypatch, tmp_path: Path):
    allowlist = tmp_path / "google_oauth_allowlist.txt"
    allowlist.write_text("allowed@example.com\n", encoding="utf-8")
    monkeypatch.setattr("app.domains.auth.service.google_oauth_allowlist_service.settings.GOOGLE_OAUTH_ALLOWLIST_PATH", allowlist)
    clear_google_oauth_allowlist_cache()

    assert ensure_google_oauth_email_allowed(" Allowed@Example.com ") == "allowed@example.com"
    clear_google_oauth_allowlist_cache()


def test_ensure_google_oauth_email_allowed_accepts_bootstrap_admin_outside_file_allowlist(
    monkeypatch, tmp_path: Path
):
    allowlist = tmp_path / "google_oauth_allowlist.txt"
    allowlist.write_text("allowed@example.com\n", encoding="utf-8")
    monkeypatch.setattr(
        "app.domains.auth.service.google_oauth_allowlist_service.settings.GOOGLE_OAUTH_ALLOWLIST_PATH",
        allowlist,
    )
    monkeypatch.setattr(
        "app.domains.auth.service.google_oauth_allowlist_service.settings.BOOTSTRAP_ADMIN_EMAILS",
        ["bootstrap-admin@example.com"],
    )
    clear_google_oauth_allowlist_cache()

    assert ensure_google_oauth_email_allowed(" Bootstrap-Admin@Example.com ") == "bootstrap-admin@example.com"
    clear_google_oauth_allowlist_cache()
