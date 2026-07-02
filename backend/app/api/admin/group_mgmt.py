from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_group_owner
from app.core.exceptions import ConflictError, NotFoundError
from app.models import Group, GroupMember, Message, User
from app.schemas import AddMemberIn, MemberOut
from app.schemas.common import ok

router = APIRouter(prefix="/admin/group", tags=["admin-group"])


@router.get("/members")
async def members(owner: GroupMember = Depends(require_group_owner), db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(GroupMember, User).join(User, User.id == GroupMember.user_id).where(
                GroupMember.group_id == owner.group_id)
        )
    ).all()
    return ok([
        MemberOut(user_id=u.id, username=u.username, nickname=u.nickname,
                  role=m.role, joined_at=m.joined_at).model_dump(mode="json")
        for m, u in rows
    ])


@router.post("/members")
async def add_member(body: AddMemberIn, owner: GroupMember = Depends(require_group_owner), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.username == body.username))
    if not user:
        raise NotFoundError("用户不存在")
    exists = await db.scalar(select(GroupMember).where(GroupMember.group_id == owner.group_id, GroupMember.user_id == user.id))
    if exists:
        raise ConflictError("已是群组成员")
    db.add(GroupMember(group_id=owner.group_id, user_id=user.id, role="member"))
    db.add(Message(user_id=user.id, msg_type="group",
           title="你被加入了新群组", related_id=owner.group_id))
    return ok(message="已添加成员")


@router.delete("/members/{user_id}")
async def remove_member(user_id, owner: GroupMember = Depends(require_group_owner), db: AsyncSession = Depends(get_db)):
    m = await db.scalar(select(GroupMember).where(GroupMember.group_id == owner.group_id, GroupMember.user_id == user_id))
    if m and m.role != "owner":
        await db.delete(m)
    return ok(message="已移除")
