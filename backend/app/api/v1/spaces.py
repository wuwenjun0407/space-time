from fastapi import APIRouter, Depends
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_active_member, get_current_user
from app.models import File, Space, SpaceFile, SpaceMember, User
from app.schemas import FileOut, SpaceOut
from app.schemas.common import ok
from app.utils.qiniu_store import private_url

router = APIRouter(tags=["spaces"])


@router.get("/spaces")
async def list_spaces(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    member = await get_active_member(db, user.id)
    visible = await db.scalars(
        select(SpaceMember.space_id).where(SpaceMember.user_id == user.id)
    )
    visible_ids = set(visible)
    rows = await db.scalars(select(Space).where(Space.group_id == member.group_id, Space.status == "active"))
    data = []
    for s in rows:
        if s.visibility == "private" and s.creator_id != user.id:
            continue
        if s.visibility == "members" and s.creator_id != user.id and s.id not in visible_ids:
            continue
        count = await db.scalar(select(func.count()).select_from(SpaceFile).where(SpaceFile.space_id == s.id))
        out = SpaceOut.model_validate(s).model_dump(mode="json")
        out["file_count"] = count or 0
        data.append(out)
    return ok(data)


@router.get("/spaces/{space_id}/files")
async def space_files(space_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(File).join(SpaceFile, SpaceFile.file_id == File.id)
            .where(SpaceFile.space_id == space_id).order_by(SpaceFile.sort_order)
        )
    ).scalars()
    items = []
    for f in rows:
        out = FileOut.model_validate(f).model_dump(mode="json")
        out["url"] = private_url(f.storage_key)
        items.append(out)
    return ok(items)
