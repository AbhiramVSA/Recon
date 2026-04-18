from functools import lru_cache
from pathlib import Path

from fastapi import HTTPException

from app.core.config import settings


def normalize_google_oauth_email(email: str) -> str:
    return email.strip().lower()


@lru_cache(maxsize=1)
def load_google_oauth_allowlist() -> frozenset[str]:
    allowlist_path = Path(settings.GOOGLE_OAUTH_ALLOWLIST_PATH)
    if not allowlist_path.is_file():
        raise RuntimeError(f"Google OAuth allowlist file not found: {allowlist_path}")

    emails = frozenset(
        normalized
        for raw_line in allowlist_path.read_text(encoding="utf-8").splitlines()
        if (normalized := normalize_google_oauth_email(raw_line)) and not normalized.startswith("#")
    )
    if not emails:
        raise RuntimeError(f"Google OAuth allowlist is empty: {allowlist_path}")
    return emails


def clear_google_oauth_allowlist_cache() -> None:
    load_google_oauth_allowlist.cache_clear()


def ensure_google_oauth_email_allowed(email: str) -> str:
    normalized = normalize_google_oauth_email(email)
    if normalized not in load_google_oauth_allowlist():
        raise HTTPException(status_code=403, detail="This Google account is not allowed to sign in")
    return normalized
