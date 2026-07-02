from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_active_member, get_current_user
from app.models import Category, User
from app.schemas import CategoryOut
from app.schemas.common import ok

router = APIRouter(tags=["categories"])


@router.get("/categories")
async def list_categories(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    member = await get_active_member(db, user.id)
    rows = await db.scalars(
        select(Category).where(Category.group_id ==
                               member.group_id).order_by(Category.sort_order)
    )
    return ok([CategoryOut.model_validate(c).model_dump(mode="json") for c in rows])
