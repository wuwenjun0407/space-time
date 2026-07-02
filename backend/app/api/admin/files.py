from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_active_member, get_current_user, require_group_owner
from app.core.exceptions import ForbiddenError
from app.models import File, GroupMember, User
from app.schemas import FileOut, FileUpdateIn
from app.schemas.common import ok
from app.utils.qiniu_store import private_url

router = APIRouter(prefix="/admin", tags=["admin-files"])


@router.get("/files")
async def admin_files(
    page: int = Query(1, ge=1), page_size: int = Query(30, ge=1, le=100),
    owner: GroupMember = Depends(require_group_owner), db: AsyncSession = Depends(get_db),
):
    base = select(File).where(File.group_id == owner.group_id)
    total = await db.scalar(select(func.count()).select_from(base.subquery()))
    rows = await db.scalars(base.order_by(File.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    items = []
    for f in rows:
        out = FileOut.model_validate(f).model_dump(mode="json")
        out["url"] = private_url(f.storage_key)
        items.append(out)
    return ok({"items": items, "total": total or 0, "page": page, "page_size": page_size})


@router.patch("/files/{file_id}")
async def edit_file(file_id, body: FileUpdateIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    f = await db.get(File, file_id)
    member = await get_active_member(db, user.id)
    if f.uploader_id != user.id and member.role != "owner":
        raise ForbiddenError("无权编辑")
    if body.description is not None:
        f.description = body.description
    if body.category_id is not None:
        f.category_id = body.category_id
    return ok(message="已更新")


@router.delete("/files/{file_id}")
async def delete_file(file_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    f = await db.get(File, file_id)
    member = await get_active_member(db, user.id)
    if f and (f.uploader_id == user.id or member.role == "owner"):
        await db.delete(f)
    return ok(message="已删除")
