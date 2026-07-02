from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Style, Theme, User
from app.schemas import StyleIn, StyleOut, ThemeIn, ThemeOut
from app.schemas.common import ok

router = APIRouter(prefix="/admin", tags=["admin-styles"])


@router.post("/styles")
async def create_style(body: StyleIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    s = Style(key=body.key, name=body.name, sort_order=body.sort_order)
    db.add(s)
    await db.flush()
    return ok(StyleOut.model_validate(s).model_dump(mode="json"))


@router.patch("/styles/{sid}")
async def edit_style(sid, body: StyleIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    s = await db.get(Style, sid)
    s.name, s.sort_order = body.name, body.sort_order
    return ok(StyleOut.model_validate(s).model_dump(mode="json"))


@router.delete("/styles/{sid}")
async def delete_style(sid, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    s = await db.get(Style, sid)
    if s:
        await db.delete(s)
    return ok(message="已删除")


@router.post("/themes")
async def create_theme(body: ThemeIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = Theme(creator_id=user.id, **body.model_dump())
    db.add(t)
    await db.flush()
    return ok(ThemeOut.model_validate(t).model_dump(mode="json"))


@router.patch("/themes/{tid}")
async def edit_theme(tid, body: ThemeIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = await db.get(Theme, tid)
    for k, v in body.model_dump().items():
        setattr(t, k, v)
    return ok(ThemeOut.model_validate(t).model_dump(mode="json"))


@router.delete("/themes/{tid}")
async def delete_theme(tid, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = await db.get(Theme, tid)
    if t and not t.is_system:
        await db.delete(t)
    return ok(message="已删除")


@router.patch("/themes/{tid}/publish")
async def publish(tid, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = await db.get(Theme, tid)
    t.is_active = True
    return ok(message="已上架")


@router.patch("/themes/{tid}/unpublish")
async def unpublish(tid, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = await db.get(Theme, tid)
    t.is_active = False
    return ok(message="已下架")
