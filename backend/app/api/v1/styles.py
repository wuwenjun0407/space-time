from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.models import Style, Theme, User, UserActiveTheme
from app.schemas import ApplyThemeIn, StyleOut, ThemeOut
from app.schemas.common import ok
from app.utils.qiniu_store import private_url

router = APIRouter(tags=["styles"])


def _theme_dump(t: Theme) -> dict:
    out = ThemeOut.model_validate(t).model_dump(mode="json")
    out["bg_image_url"] = private_url(t.bg_image_key)
    out["bg_video_url"] = private_url(t.bg_video_key)
    out["bgm_url"] = private_url(t.bgm_key)
    return out


@router.get("/styles")
async def list_styles(db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(select(Style).where(Style.is_active.is_(True)).order_by(Style.sort_order))
    return ok([StyleOut.model_validate(s).model_dump(mode="json") for s in rows])


@router.get("/styles/{style_id}/themes")
async def style_themes(style_id, db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(select(Theme).where(Theme.style_id == style_id, Theme.is_active.is_(True)))
    return ok([_theme_dump(t) for t in rows])


@router.get("/themes/{theme_id}")
async def theme_detail(theme_id, db: AsyncSession = Depends(get_db)):
    t = await db.get(Theme, theme_id)
    if not t:
        raise NotFoundError("主题不存在")
    return ok(_theme_dump(t))


@router.post("/apply-theme")
async def apply_theme(body: ApplyThemeIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    row = await db.scalar(
        select(UserActiveTheme).where(UserActiveTheme.user_id ==
                                      user.id, UserActiveTheme.target_type == body.target_type)
    )
    if row:
        row.theme_id = body.theme_id
    else:
        db.add(UserActiveTheme(user_id=user.id,
               target_type=body.target_type, theme_id=body.theme_id))
    return ok(message="皮肤已应用")


@router.get("/me/active-theme")
async def active_theme(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    row = await db.scalar(
        select(UserActiveTheme).where(UserActiveTheme.user_id ==
                                      user.id, UserActiveTheme.target_type == "home")
    )
    if not row or not row.theme_id:
        return ok(None)
    t = await db.get(Theme, row.theme_id)
    return ok(_theme_dump(t) if t else None)
