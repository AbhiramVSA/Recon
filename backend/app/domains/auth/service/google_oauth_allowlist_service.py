from dataclasses import dataclass
from pathlib import Path
from threading import Lock

from fastapi import HTTPException

from app.core.config import settings


def normalize_google_oauth_email(email: str) -> str:
    return email.strip().lower()


@dataclass(frozen=True)
class GoogleOAuthAllowlistSnapshot:
    path: Path
    mtime_ns: int
    size: int
    emails: frozenset[str]


_allowlist_snapshot: GoogleOAuthAllowlistSnapshot | None = None
_allowlist_lock = Lock()


def _read_google_oauth_allowlist_snapshot(allowlist_path: Path) -> GoogleOAuthAllowlistSnapshot:
    stat = allowlist_path.stat()
    if not allowlist_path.is_file():
        raise RuntimeError(f"Google OAuth allowlist file not found: {allowlist_path}")

    emails = frozenset(
        normalized
        for raw_line in allowlist_path.read_text(encoding="utf-8").splitlines()
        if (normalized := normalize_google_oauth_email(raw_line)) and not normalized.startswith("#")
    )
    if not emails:
        raise RuntimeError(f"Google OAuth allowlist is empty: {allowlist_path}")
    return GoogleOAuthAllowlistSnapshot(
        path=allowlist_path,
        mtime_ns=stat.st_mtime_ns,
        size=stat.st_size,
        emails=emails,
    )


def load_google_oauth_allowlist() -> frozenset[str]:
    global _allowlist_snapshot

    allowlist_path = Path(settings.GOOGLE_OAUTH_ALLOWLIST_PATH).expanduser().resolve(strict=False)
    with _allowlist_lock:
        snapshot = _allowlist_snapshot
        if snapshot and snapshot.path == allowlist_path:
            try:
                stat = allowlist_path.stat()
            except FileNotFoundError:
                raise RuntimeError(f"Google OAuth allowlist file not found: {allowlist_path}") from None

            if stat.st_mtime_ns == snapshot.mtime_ns and stat.st_size == snapshot.size:
                return snapshot.emails

        snapshot = _read_google_oauth_allowlist_snapshot(allowlist_path)
        _allowlist_snapshot = snapshot
        return snapshot.emails


def clear_google_oauth_allowlist_cache() -> None:
    global _allowlist_snapshot
    with _allowlist_lock:
        _allowlist_snapshot = None


def ensure_google_oauth_email_allowed(email: str) -> str:
    normalized = normalize_google_oauth_email(email)
    if normalized not in load_google_oauth_allowlist():
        raise HTTPException(status_code=403, detail="This Google account is not allowed to sign in")
    return normalized
