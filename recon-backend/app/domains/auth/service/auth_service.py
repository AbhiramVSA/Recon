from datetime import datetime, timezone

from fastapi import HTTPException, Response
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, hash_token
from app.domains.auth.crud import (
    create_oauth_account, create_user, get_oauth_account,
    get_refresh_token_by_hash, get_user_by_email, get_user_by_id,
    revoke_active_tokens_for_user,
)
from app.domains.auth.models import ROLE_ADMIN, User
from app.domains.auth.service.google_oauth_allowlist_service import ensure_google_oauth_email_allowed
from app.domains.auth.service.helpers import (
    build_unique_username,
    ensure_bootstrap_admin_role,
    get_default_role_for_email,
    get_user_role_name,
)


async def find_or_create_oauth_user(
    db: AsyncSession, *, provider: str, provider_user_id: str, email: str
) -> User:
    normalized_email = email.strip().lower()
    existing_user = await get_user_by_email(db, normalized_email, with_role=True)
    if existing_user and existing_user.role and existing_user.role.name == ROLE_ADMIN:
        normalized_email = normalized_email
    else:
        normalized_email = ensure_google_oauth_email_allowed(normalized_email)

    default_role = await get_default_role_for_email(db, normalized_email)

    oauth_account = await get_oauth_account(db, provider=provider, provider_user_id=provider_user_id)
    if oauth_account:
        user = await get_user_by_id(db, oauth_account.user_id, with_role=True)
        if user:
            await ensure_bootstrap_admin_role(db, user)
            return user

    user = existing_user
    if user:
        if not user.role_id:
            user.role = default_role
            await db.flush()
        else:
            await ensure_bootstrap_admin_role(db, user)
        await create_oauth_account(db, user_id=user.id, provider=provider,
                                   provider_user_id=provider_user_id, provider_email=normalized_email)
        return user

    username = await build_unique_username(db, normalized_email.split("@")[0])
    user = await create_user(db, email=normalized_email, username=username, role=default_role)
    await create_oauth_account(db, user_id=user.id, provider=provider,
                               provider_user_id=provider_user_id, provider_email=normalized_email)
    created = await get_user_by_id(db, user.id, with_role=True)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to load authenticated user")
    return created


async def issue_user_tokens(user: User, response: Response, db: AsyncSession) -> None:
    role_name = await get_user_role_name(db, user)
    access_token = create_access_token(user.id, role_name)
    refresh_token = await create_refresh_token(user.id, db)
    set_auth_cookies(response, access_token, refresh_token)


async def refresh_user_session(
    db: AsyncSession, *, refresh_token_value: str | None, response: Response
) -> User:
    if not refresh_token_value:
        raise HTTPException(status_code=401, detail="No refresh token")
    record = await get_refresh_token_by_hash(db, hash_token(refresh_token_value))
    if not record:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if record.is_revoked:
        await revoke_active_tokens_for_user(db, record.user_id)
        raise HTTPException(status_code=401, detail="Refresh token reuse detected — all sessions revoked")
    if record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")
    record.is_revoked = True
    user = await get_user_by_id(db, record.user_id, with_role=True)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    await issue_user_tokens(user, response, db)
    return user


async def logout_user_session(
    db: AsyncSession, *, refresh_token_value: str | None, response: Response
) -> None:
    if refresh_token_value:
        record = await get_refresh_token_by_hash(db, hash_token(refresh_token_value))
        if record:
            record.is_revoked = True
    clear_auth_cookies(response)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie("access_token", access_token, httponly=True,
                        secure=settings.MODE == "production", samesite="lax",
                        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, path="/")
    response.set_cookie("refresh_token", refresh_token, httponly=True,
                        secure=settings.MODE == "production", samesite="lax",
                        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400, path="/")


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
