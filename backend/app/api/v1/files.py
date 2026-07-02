from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_active_member, get_current_user
from app.models import File, User
from app.schemas import FileOut
from app.schemas.common import ok
from app.utils.qiniu_store import private_url

router = APIRouter(tags=["files"])


@router.get("/files")
async def list_files(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await get_active_member(db, user.id)
    base = select(File).where(File.group_id ==
                              member.group_id, File.status == "ready")
    total = await db.scalar(select(func.count()).select_from(base.subquery()))
    rows = await db.scalars(
        base.order_by(File.shot_at.desc().nullslast(), File.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    items = []
    for f in rows:
        out = FileOut.model_validate(f).model_dump(mode="json")
        out["url"] = private_url(f.storage_key)
        items.append(out)
    return ok({"items": items, "total": total or 0, "page": page, "page_size": page_size})


@router.get("/files/{file_id}")
async def file_detail(file_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    f = await db.get(File, file_id)
    out = FileOut.model_validate(f).model_dump(mode="json")
    out["url"] = private_url(f.storage_key)
    return ok(out)
