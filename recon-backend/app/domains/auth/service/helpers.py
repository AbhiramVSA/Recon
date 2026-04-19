from app.core.config import settings
from hashlib import sha256

from fastapi import HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domains.auth.crud import get_role_by_name, get_user_by_username
from app.domains.auth.models import ROLE_ADMIN, ROLE_PARTICIPANT, Role, User


def hash_password(password: str) -> str:
    return sha256(password.encode()).hexdigest()


async def get_role_or_500(db: AsyncSession, role_name: str) -> Role:
    role = await get_role_by_name(db, role_name)
    if not role:
        raise HTTPException(status_code=500, detail=f"Role '{role_name}' is not configured")
    return role


def is_bootstrap_admin_email(email: str) -> bool:
    normalized = email.strip().casefold()
    return normalized in {
        bootstrap_email.strip().casefold()
        for bootstrap_email in settings.BOOTSTRAP_ADMIN_EMAILS
        if bootstrap_email.strip()
    }


async def get_default_role_for_email(db: AsyncSession, email: str) -> Role:
    role_name = ROLE_ADMIN if is_bootstrap_admin_email(email) else ROLE_PARTICIPANT
    return await get_role_or_500(db, role_name)


async def ensure_bootstrap_admin_role(db: AsyncSession, user: User) -> User:
    if not is_bootstrap_admin_email(user.email):
        return user
    admin_role = await get_role_or_500(db, ROLE_ADMIN)
    if user.role_id != admin_role.id:
        user.role = admin_role
        await db.flush()
    return user


async def get_user_role_name(db: AsyncSession, user: User) -> str:
    if user.role:
        return user.role.name
    if not user.role_id:
        raise HTTPException(status_code=500, detail="User has no assigned role")
    role = await db.get(Role, user.role_id)
    if not role:
        raise HTTPException(status_code=500, detail="User role not found")
    return role.name


async def build_unique_username(db: AsyncSession, base: str) -> str:
    username, counter = base, 1
    while await get_user_by_username(db, username):
        username = f"{base}{counter}"
        counter += 1
    return username
