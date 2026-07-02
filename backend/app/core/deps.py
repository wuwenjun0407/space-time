from typing import Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AuthError, ForbiddenError, NotFoundError
from app.core.security import decode_access_token
from app.models import GroupMember, User

bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    cred: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not cred:
        raise AuthError("缺少访问令牌")
    payload = decode_access_token(cred.credentials)
    if not payload or payload.get("type") != "access":
        raise AuthError("令牌无效或已过期")
    user = await db.get(User, payload["sub"])
    if not user or user.status == "banned":
        raise AuthError("用户不存在或已被封禁")
    return user


async def require_superadmin(user: User = Depends(get_current_user)) -> User:
    if user.role != "superadmin":
        raise ForbiddenError("需要超级管理员权限")
    return user


async def get_active_member(db: AsyncSession, user_id) -> GroupMember:
    row = await db.scalar(
        select(GroupMember).where(GroupMember.user_id ==
                                  user_id, GroupMember.is_active.is_(True))
    )
    if not row:
        raise NotFoundError("无生效群组")
    return row


async def require_group_owner(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GroupMember:
    member = await get_active_member(db, user.id)
    if member.role != "owner":
        raise ForbiddenError("需要群组主理人权限")
    return member
