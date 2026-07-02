from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_active_member, get_current_user
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models import Space, SpaceFile, SpaceMember, SpaceTheme, User
from app.schemas import SpaceFileSortIn, SpaceIn, SpaceOut
from app.schemas.common import ok

router = APIRouter(prefix="/admin", tags=["admin-my-spaces"])


async def _owned(db, space_id, user):
    s = await db.get(Space, space_id)
    if not s:
        raise NotFoundError("空间不存在")
    if s.creator_id != user.id:
        raise ForbiddenError("仅空间创建者可操作")
    return s


@router.get("/my-spaces")
async def my_spaces(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    member = await get_active_member(db, user.id)
    rows = await db.scalars(
        select(Space).where(Space.group_id == member.group_id,
                            Space.creator_id == user.id, Space.status == "active")
    )
    data = []
    for s in rows:
        count = await db.scalar(select(func.count()).select_from(SpaceFile).where(SpaceFile.space_id == s.id))
        out = SpaceOut.model_validate(s).model_dump(mode="json")
        out["file_count"] = count or 0
        data.append(out)
    return ok(data)


@router.post("/my-spaces")
async def create_space(body: SpaceIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    member = await get_active_member(db, user.id)
    s = Space(group_id=member.group_id, creator_id=user.id, name=body.name,
              description=body.description, visibility=body.visibility)
    db.add(s)
    await db.flush()
    return ok(SpaceOut.model_validate(s).model_dump(mode="json"))


@router.patch("/my-spaces/{space_id}")
async def edit_space(space_id, body: SpaceIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    s = await _owned(db, space_id, user)
    s.name, s.description, s.visibility = body.name, body.description, body.visibility
    return ok(SpaceOut.model_validate(s).model_dump(mode="json"))


@router.delete("/my-spaces/{space_id}")
async def delete_space(space_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    s = await _owned(db, space_id, user)
    await db.delete(s)
    return ok(message="已删除")


@router.post("/my-spaces/{space_id}/default")
async def set_default(space_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    s = await _owned(db, space_id, user)
    for o in await db.scalars(select(Space).where(Space.group_id == s.group_id, Space.creator_id == user.id, Space.is_default.is_(True))):
        o.is_default = False
    s.is_default = True
    return ok(message="已设为默认")


@router.put("/my-spaces/{space_id}/skin")
async def set_skin(space_id, theme_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _owned(db, space_id, user)
    row = await db.scalar(select(SpaceTheme).where(SpaceTheme.space_id == space_id))
    if row:
        row.theme_id = theme_id
    else:
        db.add(SpaceTheme(space_id=space_id, theme_id=theme_id))
    return ok(message="皮肤已保存")


@router.post("/my-spaces/{space_id}/files")
async def add_files(space_id, file_ids: list[str], user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _owned(db, space_id, user)
    base = await db.scalar(select(func.coalesce(func.max(SpaceFile.sort_order), 0)).where(SpaceFile.space_id == space_id))
    for i, fid in enumerate(file_ids, 1):
        exists = await db.scalar(select(SpaceFile).where(SpaceFile.space_id == space_id, SpaceFile.file_id == fid))
        if not exists:
            db.add(SpaceFile(space_id=space_id, file_id=fid,
                   sort_order=base + i, added_by=user.id))
    return ok(message="已加入空间")


@router.delete("/my-spaces/{space_id}/files/{file_id}")
async def remove_file(space_id, file_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _owned(db, space_id, user)
    row = await db.scalar(select(SpaceFile).where(SpaceFile.space_id == space_id, SpaceFile.file_id == file_id))
    if row:
        await db.delete(row)
    return ok(message="已移除")


@router.patch("/my-spaces/{space_id}/files/sort")
async def sort_files(space_id, body: SpaceFileSortIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _owned(db, space_id, user)
    for i, fid in enumerate(body.file_ids):
        row = await db.scalar(select(SpaceFile).where(SpaceFile.space_id == space_id, SpaceFile.file_id == fid))
        if row:
            row.sort_order = i
    return ok(message="排序已保存")
