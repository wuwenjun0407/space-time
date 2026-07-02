from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.exceptions import AppException, NotFoundError
from app.models import Group, GroupMember, User
from app.schemas import GroupOut
from app.schemas.common import ok

router = APIRouter(tags=["groups"])


@router.get("/groups")
async def list_groups(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(GroupMember, Group).join(Group, Group.id ==
                                            GroupMember.group_id).where(GroupMember.user_id == user.id)
        )
    ).all()
    data = [
        GroupOut(
            id=g.id, name=g.name, description=g.description, is_personal=g.is_personal,
            role=m.role, is_active=m.is_active,
        ).model_dump(mode="json")
        for m, g in rows
    ]
    return ok(data)


@router.post("/groups/{group_id}/activate")
async def activate(group_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    target = await db.scalar(
        select(GroupMember).where(GroupMember.group_id ==
                                  group_id, GroupMember.user_id == user.id)
    )
    if not target:
        raise NotFoundError("不是该群组成员")
    for m in await db.scalars(select(GroupMember).where(GroupMember.user_id == user.id, GroupMember.is_active.is_(True))):
        m.is_active = False
    target.is_active = True
    return ok(message="已切换生效群组")


@router.post("/groups/{group_id}/leave")
async def leave(group_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    group = await db.get(Group, group_id)
    if group and group.is_personal:
        raise AppException(message="我的群组不可退出")
    m = await db.scalar(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user.id))
    if not m:
        raise NotFoundError("不是该群组成员")
    was_active = m.is_active
    await db.delete(m)
    if was_active:
        personal = await db.scalar(
            select(GroupMember).join(Group, Group.id == GroupMember.group_id).where(
                GroupMember.user_id == user.id, Group.is_personal.is_(True)
            )
        )
        if personal:
            personal.is_active = True
    return ok(message="已退出群组")
